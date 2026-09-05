'use server';

import {
	addGeneratedSongsForUser,
	findSimilarSongs,
	getSongEmbeddings,
  getUserGeneratedSongIds,
} from './db';
import { calculateCosineSimilarity } from './utils';
import {
	getAllTracks,
	getEveryAlbum,
	relatedArists,
	artistNameOf,
} from './helpers';
import { getArtistDiscographyTracks } from './spotify';

import pLimit from 'p-limit';
import { processSong } from './processSong';
import { setAccessToken } from './spotifyApi';
import { getDummyAccessToken } from './spotify-dummy-auth';

const THRESHOLD = 0.8;
const CUTOFF = 0.55;
const HIT_BONUS = 0.02;
const PLAYLIST_SIZE = 100;

type ScoredTrack = {
	uri: string;
	name: string;
	artist: string;
	hitRatio: number;
	maxScore: number;
};

function parseEmbedding(value: unknown): number[] | null {
	if (Array.isArray(value)) return value;
	if (typeof value !== 'string') return null;

	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

function scoreAgainstSeeds(emb: number[], seedEmbeddings: number[][]) {
	const scores = seedEmbeddings.map((seedEmb) =>
		calculateCosineSimilarity(emb, seedEmb),
	);

	return {
		maxScore: Math.max(...scores),
		hitRatio: scores.filter((s) => s >= THRESHOLD).length / scores.length,
	};
}

// strength of the single best match leads; matching several seeds is only a nudge
const rankOf = (t: { maxScore: number; hitRatio: number }) =>
	t.maxScore + HIT_BONUS * t.hitRatio;

const byRankDesc = (a: ScoredTrack, b: ScoredTrack) => rankOf(b) - rankOf(a);

async function getAndParseSeedEmbeddings(
	seedSpotifyIds: string[],
): Promise<number[][]> {
	const rawEmbeddings = await getSongEmbeddings(seedSpotifyIds);

	return rawEmbeddings
		.map((row: any) => parseEmbedding(row.embedding))
		.filter(Boolean) as number[][];
}

function scoreDbMatches(
	dbSimilar: any[],
	seedEmbeddings: number[][],
): ScoredTrack[] {
	return dbSimilar
		.map((song: any) => {
			const emb = parseEmbedding(song.embedding);
			if (!emb) return null;

			const scored = scoreAgainstSeeds(emb, seedEmbeddings);
			if (scored.maxScore < CUTOFF) return null;

			return {
				uri: `spotify:track:${song.spotifyId}`,
				name: song.title,
				artist: song.artist,
				...scored,
			};
		})
		.filter(Boolean) as ScoredTrack[];
}

async function scoreTracks(
	newTracks: any[],
	seedEmbeddings: number[][],
	pLimitInstance: ReturnType<typeof pLimit>,
	signal?: AbortSignal,
): Promise<ScoredTrack[]> {
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
					if (!emb) {
						return null;
					}

					const scored = scoreAgainstSeeds(emb, seedEmbeddings);
					if (scored.maxScore < CUTOFF) {
						return null;
					}

					return {
						uri: track.uri,
						name: track.name,
						artist: track.artistName,
						...scored,
					};
				} catch (e) {
					console.error(`✗ Error processing "${track.name}":`, e);
					return null;
				}
			}),
		),
	);

	const validScored = scoredTracks.filter(
		(t): t is ScoredTrack => t !== null,
	);

	console.log(
		`[Scoring Summary] ${validScored.length}/${newTracks.length} tracks passed cutoff`,
	);

	return validScored;
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

		let dbScored: ScoredTrack[] = [];

		if (seedEmbeddings.length > 0) {
			const excludeIds = [...seedSpotifyIds, ...previouslyGeneratedIds];
			const dbSimilar = await findSimilarSongs(seedEmbeddings, excludeIds, 24);
			throwIfAborted();
			dbScored = scoreDbMatches(dbSimilar, seedEmbeddings);
		}

		if (PLAYLIST_SIZE - dbScored.length <= 10) {
			const ranked = [...dbScored].sort(byRankDesc).slice(0, PLAYLIST_SIZE);
			const dbTracks = ranked.map((t) => t.uri);

			if (userId) {
				const generatedSpotifyIds = dbTracks.map((uri) =>
					uri.replace('spotify:track:', ''),
				);
				await addGeneratedSongsForUser(userId, generatedSpotifyIds);
			}
			return { tracks: dbTracks };
		}

		const titleKey = (title: string, artist: string) =>
			title.toLowerCase().trim() + '|' + artist.toLowerCase().trim();

		const candidates: ScoredTrack[] = [...dbScored];
		const checkedTrackIds = new Set<string>(
			dbScored.map((t) => t.uri.replace('spotify:track:', '')),
		);
		const checkedTrackTitles = new Set<string>(
			dbScored.map((t) => titleKey(t.name ?? '', t.artist ?? '')),
		);
		const usedArtistNames: string[] = [];

		for (let attempt = 0; attempt < 2; attempt++) {
			if (candidates.length >= PLAYLIST_SIZE) break;
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

			usedArtistNames.push(...finalList.map(artistNameOf));

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
			const acceptedTracks = await scoreTracks(
				newTracks,
				seedEmbeddings,
				pLimitInstance,
				signal,
			);
			throwIfAborted();
			candidates.push(...acceptedTracks);
			acceptedTracks.forEach((t) => {
				checkedTrackIds.add(t.uri.replace('spotify:track:', ''));
				checkedTrackTitles.add(titleKey(t.name, t.artist));
			});
		}

		const finalTracks = [...candidates]
			.sort(byRankDesc)
			.slice(0, PLAYLIST_SIZE)
			.map((t) => t.uri);

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

/**
 * Artist-only generation path. Instead of expanding through related artists,
 * this pulls the selected artist's full discography, scores those tracks
 * against the provided lyric/embedding seeds, keeps the tracks that pass the
 * similarity cutoff, ranks by strongest match, and returns up to 100 URIs.
 */
export async function generateArtistPlaylist(
	artist: { id: string; name: string },
	seeds: { id: string; name: string; artist: string[]; album?: string }[],
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
		console.log(`Generating artist playlist for ${artist.name}...`);

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

		throwIfAborted();
		const discography = await getArtistDiscographyTracks(artist.id, signal);
		if (!discography || discography.length === 0) {
			return {
				tracks: [],
				error: `No tracks could be fetched for ${artist.name}.`,
			};
		}
		const excludeIds = [...seedSpotifyIds];
		const checkedTrackIds = new Set<string>(excludeIds);
		const checkedTrackTitles = new Set<string>();
		const titleKey = (title: string, artistName: string) =>
			title.toLowerCase().trim() + '|' + artistName.toLowerCase().trim();
		const newTracks = discography.filter((t) => {
			const excluded =
				checkedTrackIds.has(t.id) ||
				checkedTrackTitles.has(titleKey(t.name, t.artistName));
			return !excluded;
		});
		const pLimitInstance = pLimit(15);
		const acceptedTracks = await scoreTracks(
			newTracks,
			seedEmbeddings,
			pLimitInstance,
			signal,
		);
		throwIfAborted();

		const finalTracks = [...acceptedTracks]
			.sort(byRankDesc)
			.slice(0, PLAYLIST_SIZE)
			.map((t) => t.uri);

		if (userId) {
			const generatedSpotifyIds = finalTracks.map((uri) =>
				uri.replace('spotify:track:', ''),
			);
			await addGeneratedSongsForUser(userId, generatedSpotifyIds);
		}

		return { tracks: finalTracks };
	} catch (error: any) {
		console.error('Error generating artist playlist:', error);
		return { tracks: [], error: error?.message || 'Unknown error' };
	}
}
