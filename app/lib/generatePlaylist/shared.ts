import {
	cacheYoutubeIdForSpotifyId,
	filterUnclaimedYoutubeIds,
	getCachedYoutubeIds,
	getSongEmbeddings,
} from '../db';
import {
	calculateCosineSimilarity,
	formatApiError,
	DB_SIMILAR_SONGS_LIMIT,
} from '../utils';
import { YOUTUBE_QUOTA_EXHAUSTED_ERROR } from '../helpers';
import { getProvider } from '../providers';
import type {
	ProviderAuthCtx,
	ProviderName,
	ProviderTrackRef,
} from '../providers/types';

import pLimit from 'p-limit';
import { processSong } from '../processSong';

const THRESHOLD = 0.8;
export const CUTOFF = 0.55;
const HIT_BONUS = 0.02;
export const PLAYLIST_SIZE = 100;
// resolving to YouTube spends search quota, so only the best of each batch is resolved
export const RESOLVE_HEADROOM = 20;

export type SeedInput = {
	id: string;
	name: string;
	artist: string[];
	album?: string;
};

export type GenerationResult = { tracks: ProviderTrackRef[]; error?: string };

export type CandidateTrack = {
	spotifyId: string;
	name: string;
	artistName: string;
	albumName?: string;
};

export type Score = { maxScore: number; hitRatio: number };

export type ScoredCandidate = CandidateTrack & Score;

export type RankedRef = ProviderTrackRef & Score;

export type ResolvedRefs = { refs: RankedRef[]; quotaExhausted: boolean };

export function createAbortGuard(signal?: AbortSignal) {
	return () => {
		if (signal?.aborted) {
			throw new Error('Aborted');
		}
	};
}

export const titleKey = (title: string, artist: string) =>
	title.toLowerCase().trim() + '|' + artist.toLowerCase().trim();

export function parseEmbedding(value: unknown): number[] | null {
	if (Array.isArray(value)) return value;
	if (typeof value !== 'string') return null;

	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

export function scoreAgainstSeeds(
	emb: number[],
	seedEmbeddings: number[][],
): Score {
	const scores = seedEmbeddings.map((seedEmb) =>
		calculateCosineSimilarity(emb, seedEmb),
	);

	return {
		maxScore: Math.max(...scores),
		hitRatio: scores.filter((s) => s >= THRESHOLD).length / scores.length,
	};
}

// strength of the single best match leads; matching several seeds is only a nudge
const rankOf = (t: Score) => t.maxScore + HIT_BONUS * t.hitRatio;

export const byRankDesc = (a: Score, b: Score) => rankOf(b) - rankOf(a);

export const toRef = ({ provider, externalId }: RankedRef): ProviderTrackRef => ({
	provider,
	externalId,
});

export async function getAndParseSeedEmbeddings(
	seedSpotifyIds: string[],
	provider: ProviderName = 'spotify',
): Promise<number[][]> {
	const rawEmbeddings = await getSongEmbeddings(seedSpotifyIds, provider);

	return rawEmbeddings
		.map((row: any) => parseEmbedding(row.embedding))
		.filter(Boolean) as number[][];
}

export async function prepareSeedEmbeddings(
	seeds: SeedInput[],
	provider: ProviderName,
	signal?: AbortSignal,
): Promise<{ seedEmbeddings: number[][] } | { error: string }> {
	const throwIfAborted = createAbortGuard(signal);

	await Promise.all(
		seeds.map(async (seed) => {
			throwIfAborted();
			return await processSong(
				{
					id: seed.id,
					title: seed.name,
					artist: seed.artist[0] || 'Unknown Artist',
					album: seed.album || 'Unknown Album',
					provider,
				},
				signal,
			);
		}),
	);

	throwIfAborted();
	const seedEmbeddings = await getAndParseSeedEmbeddings(
		seeds.map((s) => s.id),
		provider,
	);

	if (!seeds || seeds.length < 5 || seedEmbeddings.length === 0) {
		return {
			error:
				'At least 5 seed songs with valid lyrics embeddings are required to generate a playlist.',
		};
	}

	return { seedEmbeddings };
}

export async function scoreTracks(
	newTracks: CandidateTrack[],
	seedEmbeddings: number[][],
	pLimitInstance: ReturnType<typeof pLimit>,
	signal?: AbortSignal,
): Promise<ScoredCandidate[]> {
	const scoredTracks = await Promise.all(
		newTracks.map((track) =>
			pLimitInstance(async () => {
				if (signal?.aborted) return null;
				try {
					// Candidate tracks are always sourced from Spotify's catalog
					// (via getEveryAlbum/getAllTracks) regardless of the target
					// provider — only resolveSpotifyTracksToRefs maps them onto
					// the target provider afterward — so this id is always a
					// Spotify id.
					const processed = await processSong(
						{
							id: track.spotifyId,
							title: track.name,
							artist: track.artistName,
							album: track.albumName ?? 'Unknown Album',
							provider: 'spotify',
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

					return { ...track, ...scored };
				} catch (e) {
					console.error(
						`✗ Error processing "${track.name}": ${formatApiError(e)}`,
					);
					return null;
				}
			}),
		),
	);

	const validScored = scoredTracks.filter(
		(t): t is ScoredCandidate => t !== null,
	);

	console.log(
		`[Scoring Summary] ${validScored.length}/${newTracks.length} tracks passed cutoff`,
	);

	return validScored.sort(byRankDesc);
}

export async function resolveSpotifyTracksToRefs(
	candidates: ScoredCandidate[],
	provider: ProviderName,
	authCtx: ProviderAuthCtx,
): Promise<ResolvedRefs> {
	const withScore = (c: ScoredCandidate, externalId: string): RankedRef => ({
		provider,
		externalId,
		maxScore: c.maxScore,
		hitRatio: c.hitRatio,
	});

	if (provider === 'spotify') {
		return {
			refs: candidates.map((c) => withScore(c, c.spotifyId)),
			quotaExhausted: false,
		};
	}

	const youtube = getProvider('youtube');
	if (!youtube.searchTrackVideo) return { refs: [], quotaExhausted: false };

	const searchTrackVideo = youtube.searchTrackVideo!;

	const cached = await getCachedYoutubeIds(candidates.map((c) => c.spotifyId));
	const needsSearch = candidates.filter((c) => !cached.has(c.spotifyId));

	const limit = pLimit(8);
	const searched = new Map<string, string>();

	let quotaExhausted = false;

	await Promise.all(
		needsSearch.map((c) =>
			limit(async () => {
				if (quotaExhausted) return;
				try {
					const videoId = await searchTrackVideo(
						{ name: c.name, artistName: c.artistName, albumName: c.albumName },
						authCtx,
					);
					if (videoId) searched.set(c.spotifyId, videoId);
				} catch (e: any) {
					const status = e?.response?.status;
					if (status === 403 || status === 429) {
						quotaExhausted = true;
						console.warn(
							`YouTube search quota/rate limit reached (${status}) — continuing with ${cached.size + searched.size} resolved tracks`,
						);
						return;
					}
					console.warn(
						`YouTube: search failed for "${c.name}": ${formatApiError(e)}`,
					);
				}
			}),
		),
	);

	// A video already claimed by a different song means this match is wrong —
	// search landed on someone else's track — so drop it rather than repeat it.
	const unclaimed = await filterUnclaimedYoutubeIds([
		...new Set(searched.values()),
	]);

	const seenVideoIds = new Set<string>();
	const refs: RankedRef[] = [];

	for (const candidate of candidates) {
		const searchedId = searched.get(candidate.spotifyId);
		const videoId = cached.get(candidate.spotifyId) ?? searchedId;
		if (!videoId || seenVideoIds.has(videoId)) continue;
		if (searchedId && !unclaimed.has(searchedId)) continue;
		seenVideoIds.add(videoId);

		if (searchedId) {
			await cacheYoutubeIdForSpotifyId(candidate.spotifyId, videoId);
		}
		refs.push(withScore(candidate, videoId));
	}

	return { refs, quotaExhausted };
}

export async function finalizeTracks(
	refs: RankedRef[],
	{ quotaExhausted }: { quotaExhausted: boolean },
): Promise<GenerationResult> {
	const finalTracks = [...refs]
		.sort(byRankDesc)
		.slice(0, PLAYLIST_SIZE)
		.map(toRef);

	if (quotaExhausted && finalTracks.length <= DB_SIMILAR_SONGS_LIMIT) {
		return { tracks: [], error: YOUTUBE_QUOTA_EXHAUSTED_ERROR };
	}

	return { tracks: finalTracks };
}
