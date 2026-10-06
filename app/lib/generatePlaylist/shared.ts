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
import { hasActiveThemeFilter, passesThemeFilter } from '../themes/filter';
import { syncSongThemes, type ClassifiableRow } from '../themes/persist';
import type { ThemeFilters } from '../themes/slugs';
import {
	hasPaceMix,
	interleaveByPace,
	isInstrumental,
	paceOf,
	paceTargets,
	pickPaceMix,
	type Pace,
	type PaceMix,
	type Paced,
} from '../pace/mix';
import { syncAudioFeatures } from '../pace/persist';
import { createPaceBudget, type PaceBudget } from '../pace/reccobeats';
import type {
	ProviderAuthCtx,
	ProviderName,
	ProviderTrackRef,
} from '../providers/types';

import pLimit from 'p-limit';
import { processSong } from '../processSong';

const THRESHOLD = 0.8;
const CLASSIFY_CONCURRENCY = 8;
export const CUTOFF = 0.55;
const HIT_BONUS = 0.02;
export const PLAYLIST_SIZE = 100;
// resolving to YouTube spends search quota, so only the best of each batch is resolved
export const RESOLVE_HEADROOM = 20;

const MIN_SEEDS = 5;
const MIN_PACE_MIX_TRACKS = 10;
const MAX_TRACKS_PER_ARTIST_WITH_PACE = 2;

const paceMixUnmetError = (found: number) =>
	`Only ${found} matching songs fit the fast/slow mix you picked, and at least ${MIN_PACE_MIX_TRACKS} are needed. Try a different mix or turn the pace filter off.`;

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

export type ScoredCandidate = CandidateTrack & Score & Paced;

export type RankedRef = ProviderTrackRef &
	Score &
	Paced & { artistName: string };

export type ResolvedRefs = { refs: RankedRef[]; quotaExhausted: boolean };

type ProcessedSong = NonNullable<Awaited<ReturnType<typeof processSong>>>;

type ScoredWithSong = ScoredCandidate & { song: ProcessedSong };

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

function matchingSeedIds(
	seeds: SeedInput[],
	processed: ({ themes?: string[] | null } | null)[],
	themeFilters?: ThemeFilters,
): string[] {
	const allIds = seeds.map((s) => s.id);
	if (!hasActiveThemeFilter(themeFilters)) return allIds;

	const allowed = seeds
		.filter((_, i) => passesThemeFilter(processed[i]?.themes, themeFilters))
		.map((s) => s.id);

	if (allowed.length < MIN_SEEDS) {
		console.log(
			`Only ${allowed.length}/${seeds.length} seeds clear the theme filter, matching on all of them`,
		);
		return allIds;
	}

	if (allowed.length < allIds.length) {
		console.log(
			`Matching on ${allowed.length}/${seeds.length} seeds; the rest carry a restricted theme`,
		);
	}
	return allowed;
}

export async function prepareSeedEmbeddings(
	seeds: SeedInput[],
	provider: ProviderName,
	signal?: AbortSignal,
	themeFilters?: ThemeFilters,
): Promise<{ seedEmbeddings: number[][] } | { error: string }> {
	const throwIfAborted = createAbortGuard(signal);

	const processed = await Promise.all(
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
		matchingSeedIds(seeds, processed, themeFilters),
		provider,
	);

	if (!seeds || seeds.length < MIN_SEEDS || seedEmbeddings.length === 0) {
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
	themeFilters?: ThemeFilters,
	paceBudget: PaceBudget = createPaceBudget(),
): Promise<ScoredCandidate[]> {
	const filtering = hasActiveThemeFilter(themeFilters);

	const scoredTracks = await Promise.all(
		newTracks
			.filter((track) => !isInstrumental(track.name))
			.map((track) =>
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
						{ classifyThemes: false },
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

					return { ...track, ...scored, song: processed };
				} catch (e) {
					console.error(
						`✗ Error processing "${track.name}": ${formatApiError(e)}`,
					);
					return null;
				}
			}),
		),
	);

	const survivors = scoredTracks.filter(
		(t): t is ScoredWithSong => t !== null,
	);

	const kept = filtering
		? await keepMatchingThemes(survivors, themeFilters, signal)
		: survivors;

	const droppedOnThemes = survivors.length - kept.length;
	console.log(
		`[Scoring Summary] ${survivors.length}/${newTracks.length} tracks passed cutoff` +
			(filtering ? ` (${droppedOnThemes} dropped on themes)` : ''),
	);

	const features = await syncAudioFeatures(
		kept.map(({ song }) => song),
		paceBudget,
		signal,
	);

	return kept
		.filter(({ name, song }) => !isInstrumental(name, features.get(song.id)))
		.map(({ song, ...candidate }) => ({
			...candidate,
			pace: paceOf(features.get(song.id)),
		}))
		.sort(byRankDesc);
}

/** Keeps each artist's best-ranked tracks up to the cap; expects rank order. */
function capPerArtist<T extends { artistName: string }>(ranked: T[]): T[] {
	const counts = new Map<string, number>();

	return ranked.filter(({ artistName }) => {
		const artist = artistName.toLowerCase().trim();
		const count = counts.get(artist) ?? 0;
		if (count >= MAX_TRACKS_PER_ARTIST_WITH_PACE) return false;

		counts.set(artist, count + 1);
		return true;
	});
}

/** The pace-mixed playlist, best-ranked first, before interleaving. */
function pickPacedTracks<T extends RankedRef>(refs: T[], paceMix: PaceMix): T[] {
	const ranked = capPerArtist([...refs].sort(byRankDesc));
	return pickPaceMix(ranked, paceMix, PLAYLIST_SIZE);
}

export function fillableCount(refs: RankedRef[], paceMix?: PaceMix): number {
	return hasPaceMix(paceMix)
		? pickPacedTracks(refs, paceMix).length
		: refs.length;
}

/** Best candidates worth resolving, budgeted per pace bucket when a mix is set. */
export function selectForResolve(
	scored: ScoredCandidate[],
	existing: Paced[],
	paceMix?: PaceMix,
): ScoredCandidate[] {
	if (!hasPaceMix(paceMix)) {
		return scored.slice(
			0,
			Math.max(PLAYLIST_SIZE - existing.length, 0) + RESOLVE_HEADROOM,
		);
	}

	const eligible = capPerArtist(scored);
	const target = paceTargets(PLAYLIST_SIZE, paceMix);
	const take = (pace: Pace) => {
		const need = target[pace] - existing.filter((r) => r.pace === pace).length;
		if (need <= 0) return [];

		const headroom = Math.ceil((RESOLVE_HEADROOM * target[pace]) / PLAYLIST_SIZE);
		return eligible.filter((c) => c.pace === pace).slice(0, need + headroom);
	};

	const chosen = new Set([...take('fast'), ...take('slow')]);
	return scored.filter((c) => chosen.has(c));
}

/**
 * Themes are resolved only for tracks that already cleared the cutoff, in their
 * own pool — classifying inside the track pool would hold a track slot open for
 * a second network hop and throttle everything behind it.
 */
export async function keepMatchingThemes<T extends { song: ClassifiableRow }>(
	survivors: T[],
	themeFilters: ThemeFilters | undefined,
	signal?: AbortSignal,
): Promise<T[]> {
	const limit = pLimit(CLASSIFY_CONCURRENCY);

	const checked = await Promise.all(
		survivors.map((candidate) =>
			limit(async () => {
				const { song } = candidate;
				const themes =
					(await syncSongThemes(song, signal)) ?? song.themes ?? [];

				return passesThemeFilter(themes, themeFilters) ? candidate : null;
			}),
		),
	);

	return checked.filter((c): c is Awaited<T> => c !== null);
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
		pace: c.pace,
		artistName: c.artistName,
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
	{ quotaExhausted, paceMix }: { quotaExhausted: boolean; paceMix?: PaceMix },
): Promise<GenerationResult> {
	const finalTracks = (
		hasPaceMix(paceMix)
			? interleaveByPace(pickPacedTracks(refs, paceMix))
			: [...refs].sort(byRankDesc).slice(0, PLAYLIST_SIZE)
	).map(toRef);

	if (quotaExhausted && finalTracks.length <= DB_SIMILAR_SONGS_LIMIT) {
		return { tracks: [], error: YOUTUBE_QUOTA_EXHAUSTED_ERROR };
	}

	if (hasPaceMix(paceMix) && finalTracks.length < MIN_PACE_MIX_TRACKS) {
		return { tracks: [], error: paceMixUnmetError(finalTracks.length) };
	}

	return { tracks: finalTracks };
}
