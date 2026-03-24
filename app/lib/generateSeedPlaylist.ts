'use server';

import {
	addGeneratedSongsForUser,
	findSimilarSongs,
	getSongEmbeddings,
	getUserGeneratedSongIds,
} from './db';
import {
	calculateCosineSimilarity,
	getAllTracks,
	getEveryAlbum,
	logToken,
	relatedArists,
} from './utils';

import pLimit from 'p-limit';
import { processSong } from './processSong';
import { setAccessToken } from './spotifyApi';

export async function generateSeedPlaylist(
	seeds: { id: string; name: string; artist: string[]; album?: string }[],
	artistNames: string[],
	options: { isNotPopular: boolean; isDifferent: boolean },
	accessToken?: string,
	userId?: string,
): Promise<{ tracks: string[]; error?: string }> {
	try {
		if (accessToken) setAccessToken(accessToken);
		logToken(accessToken);
		console.log('Generating seed playlist...');

		// Fetch previously generated songs for this user
		let previouslyGeneratedIds: string[] = [];
		if (userId) {
			previouslyGeneratedIds = await getUserGeneratedSongIds(userId);
		}

		// 1. Process seeds to ensure they are in DB & have embeddings
		const seedSpotifyIds = seeds.map((s) => s.id);

		await Promise.all(
			seeds.map((seed) =>
				processSong({
					id: seed.id,
					title: seed.name,
					artist: seed.artist[0] || 'Unknown Artist',
					album: seed.album || 'Unknown Album',
				}),
			),
    );

		// 2. Fetch seed embeddings from DB
    const rawEmbeddings = await getSongEmbeddings(seedSpotifyIds);
    
		// PgVector from Prisma raw queries usually returns strings like "[0.1, 0.2, ...]"
		const seedEmbeddings: number[][] = rawEmbeddings
			.map((row: any) => {
				if (typeof row.embedding === 'string') {
					try {
						return JSON.parse(row.embedding);
					} catch (e) {
						return null;
					}
				}
				if (Array.isArray(row.embedding)) return row.embedding;
				return null;
			})
			.filter(Boolean) as number[][];
		let dbMatchesUris: string[] = [];
		let remainingNeeded = 100;

		// 3. Find similar songs in DB if we have embeddings
		if (seedEmbeddings.length > 0) {
			const excludeIds = [...seedSpotifyIds, ...previouslyGeneratedIds];
			const dbSimilar = await findSimilarSongs(seedEmbeddings, excludeIds, 24);
			dbMatchesUris = dbSimilar.map(
				(song: any) => `spotify:track:${song.spotifyId}`,
			);
			remainingNeeded = 100 - dbMatchesUris.length;
		}

		if (remainingNeeded <= 10) {
			// Store generated songs before returning
			if (userId) {
				const generatedSpotifyIds = dbMatchesUris.map((uri) =>
					uri.replace('spotify:track:', ''),
				);
				await addGeneratedSongsForUser(userId, generatedSpotifyIds);
			}
			return { tracks: dbMatchesUris };
		}

		// 4. AI Fallback for remaining songs
		console.log(`AI Fallback check: remainingNeeded=${remainingNeeded}`);
		const finalList = await relatedArists(artistNames, options);

		console.log('Getting albums for artists...', finalList);
		const albums = await getEveryAlbum(finalList);

		console.log('Getting tracks for albums...');
		const aiTracks = (await getAllTracks(albums as string[], 5, true)) as any[]; // Need more tracks to filter down

		console.log('AI Tracks:', aiTracks);

		let fallbackTracksUris: string[] = [];

		if (aiTracks && aiTracks.length > 0) {
			if (seedEmbeddings.length > 0) {
				console.log(
					`Running concurrent lyrical similarity on ${aiTracks.length} AI tracks...`,
				);

				// p-limit concurrency of 15
				const limit = pLimit(15);

        // 0.6 is a good starting point, but you can tune this
        const THRESHOLD = 0.65

        // we want to avoid low quality recommendations so we check each song against all seeds(selected songs) put that into an array and sort by the number of seeds that match the treshold then return the top 100
        // we also want to avoid songs that are too far in similarity to the seeds so we set a cutoff of 0.2 below the threshold to give extra grace
const CUTOFF = THRESHOLD - 0.25 

const scoredTracks = await Promise.all(
  aiTracks.map(track => limit(async () => {
    try {
      console.log(`Processing: "${track.name}" by ${track.artistName} (id: ${track.id})`);
      const processed = await processSong({
        id: track.id,
        title: track.name,
        artist: track.artistName,
        album: track.albumName,
      })
      const emb = processed.embeddingData
      if (!emb) return null

      const scores = seedEmbeddings.map(seedEmb => 
        calculateCosineSimilarity(emb, seedEmb)
      )

      const maxScore = Math.max(...scores)
      console.log(`Scores: [${scores.map(s => s.toFixed(4)).join(', ')}] | maxScore=${maxScore.toFixed(4)} | CUTOFF=${CUTOFF}`);
      
      // cut off songs that don't even come close
      if (maxScore < CUTOFF) {
        console.log(`✗ Below cutoff (${maxScore.toFixed(4)} < ${CUTOFF}) — skipping`);
        return null
      }

      const thresholdHits = scores.filter(s => s >= THRESHOLD).length
      console.log(`✓ Passed cutoff | thresholdHits=${thresholdHits} (THRESHOLD=${THRESHOLD})`);

      return { uri: track.uri, thresholdHits, maxScore }

    } catch (e) {
      console.error(`✗ Error processing "${track.name}":`, e);
      return null
    }
  }))
)

const validScored = scoredTracks
  .filter((t): t is { uri: string; thresholdHits: number; maxScore: number } => t !== null);
console.log(`[Scoring Summary] ${validScored.length}/${aiTracks.length} tracks passed cutoff`);

const sortedScored = validScored
  .sort((a, b) => b.thresholdHits - a.thresholdHits || b.maxScore - a.maxScore);
console.log(`[Scoring Sorted] Top results:`, sortedScored.slice(0, 10).map(t => ({
  uri: t.uri, hits: t.thresholdHits, max: t.maxScore.toFixed(4)
})));

fallbackTracksUris = sortedScored
  .map(t => t.uri)
  .slice(0, remainingNeeded)
console.log(`[Scoring Final] Returning ${fallbackTracksUris.length} fallback tracks (remainingNeeded=${remainingNeeded})`);
			} else {
				// If no seeds, just use the random tracks, filtering out previous ones
				fallbackTracksUris = aiTracks
					.filter((t) => !userId || !previouslyGeneratedIds.includes(t.id))
					.map((t) => t.uri);
			}
		}

		// Fill remaining, ensuring exact 100 limit
		const finalTracks = [
			...new Set([...dbMatchesUris, ...fallbackTracksUris]),
		].slice(0, 100);

		// Store generated songs for this user
		if (userId) {
			const generatedSpotifyIds = finalTracks.map((uri) =>
				uri.replace('spotify:track:', ''),
			);
			await addGeneratedSongsForUser(userId, generatedSpotifyIds);
		}

		return { tracks: finalTracks };
	} catch (error: any) {
		console.error('Error generating seed playlist:', error);
		return { tracks: [], error: error?.message || 'Unknown error' };
	}
}

// TODO: use the same algorithm for the songs coming from the db  - they should be scored and sorted as well