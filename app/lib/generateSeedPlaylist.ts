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
	relatedArists,
} from './utils';

import pLimit from 'p-limit';
import { processSong } from './processSong';
import { setAccessToken } from './spotifyApi';
import { getDummyAccessToken } from './spotify-dummy-auth';

async function getAndParseSeedEmbeddings(
	seedSpotifyIds: string[],
): Promise<number[][]> {
	const rawEmbeddings = await getSongEmbeddings(seedSpotifyIds);

	return rawEmbeddings
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
}

async function scoreAndFilterTracks(
	newTracks: any[],
	seedEmbeddings: number[][],
	accumulatedUris: string[],
	pLimitInstance: ReturnType<typeof pLimit>,
	signal?: AbortSignal,
): Promise<{ uri: string; name: string; artist: string }[]> {
	const THRESHOLD = 0.8;
	const CUTOFF = THRESHOLD - 0.25;
	const needed = 100 - accumulatedUris.length + 20;

	const scoredTracks = await Promise.all(
		newTracks.map((track) =>
			pLimitInstance(async () => {
				if (signal?.aborted) return null;
				try {
					const processed = await processSong(
						{
							id: track.id,
							title: track.name,
							artist: track.artistName,
							album: track.albumName,
						},
						signal,
					);
					if (signal?.aborted) return null;
					const emb = processed?.embeddingData;
					if (!emb) return null;

					const scores = seedEmbeddings.map((seedEmb) =>
						calculateCosineSimilarity(emb, seedEmb),
					);

					const maxScore = Math.max(...scores);
					if (maxScore < CUTOFF) {
						return null;
					}

					const thresholdHits = scores.filter((s) => s >= THRESHOLD).length;
					return {
						uri: track.uri,
						name: track.name,
						artist: track.artistName,
						thresholdHits,
						maxScore,
					};
				} catch (e) {
					console.error(`✗ Error processing "${track.name}":`, e);
					return null;
				}
			}),
		),
	);

	const validScored = scoredTracks.filter(
		(
			t,
		): t is {
			uri: string;
			name: string;
			artist: string;
			thresholdHits: number;
			maxScore: number;
		} => t !== null,
	);

	console.log(
		`[Scoring Summary] ${validScored.length}/${newTracks.length} tracks passed cutoff`,
	);

	const sortedScored = validScored.sort(
		(a, b) => b.thresholdHits - a.thresholdHits || b.maxScore - a.maxScore,
	);
	const newTracksAccepted = sortedScored.slice(0, needed);

	return newTracksAccepted;
}

export async function generateSeedPlaylist(
	seeds: { id: string; name: string; artist: string[]; album?: string }[],
	artistNames: string[],
	options: { isNotPopular: boolean; isDifferent: boolean },
	userId?: string,
	signal?: AbortSignal,
): Promise<{ tracks: string[]; error?: string }> {
	const throwIfAborted = () => {
		if (signal?.aborted) {
			throw new Error('Aborted');
		}
	};

	try {
		throwIfAborted();
		const token = await getDummyAccessToken();
		setAccessToken(token);
		console.log('Generating seed playlist...');

		let previouslyGeneratedIds: string[] = [];
		if (userId) {
			previouslyGeneratedIds = await getUserGeneratedSongIds(userId);
		}

		const seedSpotifyIds = seeds.map((s) => s.id);

		await Promise.all(
			seeds.map(async (seed) => {
				throwIfAborted();
				return await processSong(
					{
						id: seed.id,
						title: seed.name,
						artist: seed.artist[0] || 'Unknown Artist',
						album: seed.album || 'Unknown Album',
					},
					signal,
				);
			}),
		);

		throwIfAborted();
		const seedEmbeddings = await getAndParseSeedEmbeddings(seedSpotifyIds);

		if (!seeds || seeds.length < 5 || seedEmbeddings.length === 0) {
			return {
				tracks: [],
				error:
					'At least 5 seed songs with valid lyrics embeddings are required to generate a playlist.',
			};
		}

		let dbMatchesUris: string[] = [];
		let remainingNeeded = 100;

		if (seedEmbeddings.length > 0) {
			const excludeIds = [...seedSpotifyIds, ...previouslyGeneratedIds];
			const dbSimilar = await findSimilarSongs(seedEmbeddings, excludeIds, 24);
			throwIfAborted();
			dbMatchesUris = dbSimilar.map(
				(song: any) => `spotify:track:${song.spotifyId}`,
			);
			remainingNeeded = 100 - dbMatchesUris.length;
		}

		if (remainingNeeded <= 10) {
			if (userId) {
				const generatedSpotifyIds = dbMatchesUris.map((uri) =>
					uri.replace('spotify:track:', ''),
				);
				await addGeneratedSongsForUser(userId, generatedSpotifyIds);
			}
			return { tracks: dbMatchesUris };
		}

		const accumulatedUris = [...dbMatchesUris];
		const checkedTrackIds = new Set<string>(
			dbMatchesUris.map((uri) => uri.replace('spotify:track:', '')),
		);
		const checkedTrackTitles = new Set<string>();
		const titleKey = (title: string, artist: string) =>
			title.toLowerCase().trim() + '|' + artist.toLowerCase().trim();
		const usedArtistNames: string[] = [];

		for (let attempt = 0; attempt < 2; attempt++) {
			if (accumulatedUris.length >= 80) break;

			console.log(
				`AI Fallback attempt ${attempt + 1}: accumulated=${accumulatedUris.length}, remainingNeeded=${100 - accumulatedUris.length}`,
			);
			throwIfAborted();

		const targetArtists =
			seeds.length > 0
				? Array.from(new Set(seeds.flatMap((s) => s.artist)))
				: artistNames;

		const finalList = await relatedArists(
			targetArtists,
			options,
			signal,
			usedArtistNames,
		);
			throwIfAborted();

			usedArtistNames.push(...finalList);

			const albums = await getEveryAlbum(finalList, signal);
			throwIfAborted();

			const aiTracks = (await getAllTracks(
				albums as string[],
				2,
				true,
				signal,
			)) as any[];

			if (!aiTracks || aiTracks.length === 0) continue;

			const newTracks = aiTracks.filter(
				(t) =>
					!checkedTrackIds.has(t.id) &&
					!checkedTrackTitles.has(titleKey(t.name, t.artistName)),
			);

			const pLimitInstance = pLimit(15);
			const acceptedTracks = await scoreAndFilterTracks(
				newTracks,
				seedEmbeddings,
				accumulatedUris,
				pLimitInstance,
				signal,
			);
			throwIfAborted();
			const newUris = acceptedTracks.map((t) => t.uri);
			accumulatedUris.push(...newUris);
			newUris.forEach((uri) =>
				checkedTrackIds.add(uri.replace('spotify:track:', '')),
			);
			acceptedTracks.forEach((t) =>
				checkedTrackTitles.add(titleKey(t.name, t.artist)),
			);
		}

		const finalTracks = [...accumulatedUris].slice(0, 100);

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
