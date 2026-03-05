'use server';

import { processSong } from './processSong';
import { findSimilarSongs, getSongEmbeddings } from './db';
import { getEveryAlbum, getAllTracks, calculateCosineSimilarity, getCentroid, fetchSimilarArtistsFromAI, logToken } from './utils';
import { setAccessToken } from './spotifyApi';
import pLimit from 'p-limit';

export async function generateSeedPlaylist(
	seeds: { id: string; name: string; artist: string[]; album?: string }[],
	artistNames: string[],
	options: { isNotPopular: boolean; isDifferent: boolean },
	accessToken?: string
): Promise<{ tracks: string[]; error?: string }> {
	try {
		if (accessToken) setAccessToken(accessToken);
		logToken(accessToken);
		console.log('Generating seed playlist...');
		// 1. Process seeds to ensure they are in DB & have embeddings
		const seedSpotifyIds = seeds.map(s => s.id);
		
	const processedSeeds = await Promise.all(
  seeds.map(seed => processSong({
    id: seed.id,
    title: seed.name,
    artist: seed.artist[0] || 'Unknown Artist',
    album: seed.album,
  }))
)
    
		// 2. Fetch seed embeddings from DB
		const rawEmbeddings = await getSongEmbeddings(seedSpotifyIds);
		// PgVector from Prisma raw queries usually returns strings like "[0.1, 0.2, ...]"
		const seedEmbeddings: number[][] = rawEmbeddings
			.map((row: any) => {
				if (typeof row.embedding === 'string') {
					try {
						return JSON.parse(row.embedding);
					} catch(e) { return null }
				}
				if (Array.isArray(row.embedding)) return row.embedding;
				return null;
			})
			.filter(Boolean) as number[][];

		let dbMatchesUris: string[] = [];
		let remainingNeeded = 100;

		// 3. Find similar songs in DB if we have embeddings
		if (seedEmbeddings.length > 0) {
			const dbSimilar = await findSimilarSongs(seedEmbeddings, seedSpotifyIds, 24);
			dbMatchesUris = dbSimilar.map((song: any) => `spotify:track:${song.spotifyId}`);
			remainingNeeded = 100 - dbMatchesUris.length;
		}

		if (remainingNeeded <= 10) {
			return { tracks: dbMatchesUris };
		}

		// 4. AI Fallback for remaining songs
		console.log(`AI Fallback check: remainingNeeded=${remainingNeeded}`);
		const finalList = await fetchSimilarArtistsFromAI(artistNames, options, processedSeeds.map(s => ({
    name: s.title,
    artist: s.artist,
    summary: s.summary
  })));

		console.log('Getting albums for artists...', finalList);
		const albums = await getEveryAlbum(finalList);

		console.log('Getting tracks for albums...');
		const aiTracks = await getAllTracks(albums as string[], 3, true) as any[]; // Need more tracks to filter down

    console.log('AI Tracks:', aiTracks);
    
		let fallbackTracksUris: string[] = [];

		if (aiTracks && aiTracks.length > 0) {
			if (seedEmbeddings.length > 0) {
				console.log(`Running concurrent lyrical similarity on ${aiTracks.length} AI tracks...`);

        // p-limit concurrency of 10
        const limit = pLimit(10);

				const scoredTracks = await Promise.all(aiTracks.map(track => limit(async () => {
					try {
						// Process song caches or generates the embedding in DB
						await processSong({
							id: track.id,
							title: track.name,
							artist: track.artistName,
							album: track.albumName,
						});

						// Fetch its generated embedding
						const trackEmbeddingRaw = await getSongEmbeddings([track.id]);
						if (trackEmbeddingRaw.length > 0) {
							const embRaw = trackEmbeddingRaw[0].embedding;
							const emb = typeof embRaw === 'string' ? JSON.parse(embRaw) : embRaw;
							
							const similarity = seedEmbeddings.reduce((sum, seedEmb) => {
  return sum + calculateCosineSimilarity(emb, seedEmb)
}, 0) / seedEmbeddings.length
							return { uri: track.uri, similarity };
						}
            return null;

					} catch (e) {
            // Skip tracks that fail lyrics extraction
            console.log(e)
						console.error(`Skipping ${track.name} due to error`);
            return null;
					} finally {
            await new Promise(r => setTimeout(r, 50));
          }
				})));

				// Sort by similarity descending, filtering out nulls
				fallbackTracksUris = (scoredTracks as { uri: string; similarity: number }[])
          .filter((t): t is { uri: string; similarity: number } => t !== null)
          .sort((a, b) => b.similarity - a.similarity)
          .map(t => t.uri);
			} else {
				// If no seeds, just use the random tracks
				fallbackTracksUris = aiTracks.map(t => t.uri);
			}
		}
		
		// Fill remaining, ensuring exact 100 limit
		const finalTracks = [...new Set([...dbMatchesUris, ...fallbackTracksUris])].slice(0, 100);

		return { tracks: finalTracks };
	} catch (error: any) {
		console.error('Error generating seed playlist:', error);
		return { tracks: [], error: error?.message || 'Unknown error' };
	}
}

// TODO: add that the spotify id of songs generated for a user is stored in the db so that we don't repeat songs for the same user and they get new songs everytime