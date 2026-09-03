'use server';

import {
	addGeneratedSongsForUser,
	cacheYoutubeIdForSpotifyId,
	filterUnclaimedYoutubeIds,
	getCachedYoutubeIds,
	findSimilarSongs,
	getSongEmbeddings,
	getUserGeneratedSongIds,
	decodeGeneratedSongId,
} from './db';
import {
	calculateCosineSimilarity,
	formatApiError,
	DB_SIMILAR_SONGS_LIMIT,
} from './utils';
import {
	getAllTracks,
	getEveryAlbum,
	relatedArists,
	artistNameOf,
	YOUTUBE_QUOTA_EXHAUSTED_ERROR,
} from './helpers';
import { getProvider } from './providers';
import type {
	ProviderAuthCtx,
	ProviderName,
	ProviderTrackRef,
} from './providers/types';

import pLimit from 'p-limit';
import { processSong } from './processSong';
import { setAccessToken } from './spotifyApi';
import { getDummyAccessToken } from './spotify-dummy-auth';

type CandidateTrack = {
	spotifyId: string;
	name: string;
	artistName: string;
	albumName?: string;
};

type ResolvedRefs = { refs: ProviderTrackRef[]; quotaExhausted: boolean };


async function getAndParseSeedEmbeddings(
	seedSpotifyIds: string[],
	provider: ProviderName = 'spotify',
): Promise<number[][]> {
	const rawEmbeddings = await getSongEmbeddings(seedSpotifyIds, provider);

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
	newTracks: CandidateTrack[],
	seedEmbeddings: number[][],
	accumulatedIds: Set<string>,
	pLimitInstance: ReturnType<typeof pLimit>,
	signal?: AbortSignal,
): Promise<CandidateTrack[]> {
	const THRESHOLD = 0.8;
	const CUTOFF = THRESHOLD - 0.25;
	const CUTOFF_EPSILON = 0.02;
	const needed = 100 - accumulatedIds.size + 20;

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

					const scores = seedEmbeddings.map((seedEmb) =>
						calculateCosineSimilarity(emb, seedEmb),
					);

					const maxScore = Math.max(...scores);
					if (maxScore < CUTOFF - CUTOFF_EPSILON) {
						return null;
					}
					const thresholdHits = scores.filter((s) => s >= THRESHOLD).length;
					return {
						...track,
						thresholdHits,
						maxScore,
					};
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
		(t): t is CandidateTrack & { thresholdHits: number; maxScore: number } =>
			t !== null,
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

async function resolveSpotifyTracksToRefs(
	candidates: CandidateTrack[],
	provider: ProviderName,
	authCtx: ProviderAuthCtx,
): Promise<ResolvedRefs> {
	if (provider === 'spotify') {
		return {
			refs: candidates.map((c) => ({
				provider: 'spotify',
				externalId: c.spotifyId,
			})),
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
	const refs: ProviderTrackRef[] = [];

	for (const candidate of candidates) {
		const searchedId = searched.get(candidate.spotifyId);
		const videoId = cached.get(candidate.spotifyId) ?? searchedId;
		if (!videoId || seenVideoIds.has(videoId)) continue;
		if (searchedId && !unclaimed.has(searchedId)) continue;
		seenVideoIds.add(videoId);

		if (searchedId) {
			await cacheYoutubeIdForSpotifyId(candidate.spotifyId, videoId);
		}
		refs.push({ provider: 'youtube', externalId: videoId });
	}

	return { refs, quotaExhausted };
}

export async function generateSeedPlaylist(
	seeds: { id: string; name: string; artist: string[]; album?: string }[],
	artistNames: string[],
	options: { isNotPopular: boolean; isDifferent: boolean },
	userId?: string,
	provider: ProviderName = 'spotify',
	signal?: AbortSignal,
	youtubeGuestCredentials?: ProviderAuthCtx['youtubeGuestCredentials'],
): Promise<{ tracks: ProviderTrackRef[]; error?: string }> {
	const authCtx: ProviderAuthCtx = { userId, youtubeGuestCredentials };
	const throwIfAborted = () => {
		if (signal?.aborted) {
			throw new Error('Aborted');
		}
	};

	try {
		throwIfAborted();
		const token = await getDummyAccessToken();
		setAccessToken(token);
		console.log(`Generating seed playlist (provider=${provider})...`);

		let previouslyGeneratedIds: string[] = [];
		if (userId) {
			const raw = await getUserGeneratedSongIds(userId);
			previouslyGeneratedIds = raw
				.map((entry) => decodeGeneratedSongId(entry))
				.filter((d): d is { provider: ProviderName; externalId: string } => {
					if (!d) return false;
					// keep only ids that belong to the active provider's space,
					// restored to their bare external id.
					return d.provider === provider;
				})
				.map((d) => d.externalId);
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
						provider,
					},
					signal,
				);
			}),
		);

		throwIfAborted();
		const seedEmbeddings = await getAndParseSeedEmbeddings(
			seedSpotifyIds,
			provider,
		);

		if (!seeds || seeds.length < 5 || seedEmbeddings.length === 0) {
			return {
				tracks: [],
				error:
					'At least 5 seed songs with valid lyrics embeddings are required to generate a playlist.',
			};
		}

		let dbMatchesRefs: ProviderTrackRef[] = [];
		let remainingNeeded = 100;

		if (seedEmbeddings.length > 0) {
			const excludeIds = [...seedSpotifyIds, ...previouslyGeneratedIds];
			const dbSimilar = await findSimilarSongs(
				seedEmbeddings,
				excludeIds,
				DB_SIMILAR_SONGS_LIMIT,
				provider,
			);
			throwIfAborted();
			dbMatchesRefs = dbSimilar.map(
				(song: any) =>
					({ provider, externalId: song.externalId }) as ProviderTrackRef,
			);
			remainingNeeded = 100 - dbMatchesRefs.length;
		}

		if (remainingNeeded <= 10) {
			if (userId) {
				await addGeneratedSongsForUser(
					userId,
					dbMatchesRefs.map((r) => r.externalId),
					provider,
				);
			}
			return { tracks: dbMatchesRefs };
		}

		let hitQuotaLimit = false;
		const accumulatedRefs = [...dbMatchesRefs];
		const checkedTrackIds = new Set<string>(
			dbMatchesRefs.map((r) => r.externalId),
		);
		const checkedTrackTitles = new Set<string>();
		const titleKey = (title: string, artist: string) =>
			title.toLowerCase().trim() + '|' + artist.toLowerCase().trim();
		const usedArtistNames: string[] = [];

		for (let attempt = 0; attempt < 2; attempt++) {
			if (accumulatedRefs.length >= 80) break;
			throwIfAborted();

			try {
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

				const newTracks = aiTracks
					.filter(
						(t: any) =>
							!checkedTrackIds.has(t.id) &&
							!checkedTrackTitles.has(titleKey(t.name, t.artistName)),
					)
					.map((t: any): CandidateTrack => ({
						spotifyId: t.id,
						name: t.name,
						artistName: t.artistName,
						albumName: t.albumName,
					}));

				const pLimitInstance = pLimit(15);
				const acceptedTracks = await scoreAndFilterTracks(
					newTracks,
					seedEmbeddings,
					checkedTrackIds,
					pLimitInstance,
					signal,
				);
				throwIfAborted();

				const { refs: newRefs, quotaExhausted } =
					await resolveSpotifyTracksToRefs(acceptedTracks, provider, authCtx);
				if (quotaExhausted) hitQuotaLimit = true;

				accumulatedRefs.push(...newRefs);
				newRefs.forEach((r) => checkedTrackIds.add(r.externalId));
				acceptedTracks.forEach((t) =>
					checkedTrackTitles.add(titleKey(t.name, t.artistName)),
				);
			} catch (e) {
				if (signal?.aborted) throw e;
				console.warn(
					`Expansion attempt ${attempt + 1} failed, keeping ${accumulatedRefs.length} tracks: ${formatApiError(e)}`,
				);
				break;
			}
		}

		const finalTracks = [...accumulatedRefs].slice(0, 100);

		if (userId) {
			await addGeneratedSongsForUser(
				userId,
				finalTracks.map((r) => r.externalId),
				provider,
			);
		}

		if (hitQuotaLimit && finalTracks.length <= DB_SIMILAR_SONGS_LIMIT) {
			return { tracks: [], error: YOUTUBE_QUOTA_EXHAUSTED_ERROR };
		}

		return { tracks: finalTracks };
	} catch (error: any) {
		console.error('Error generating seed playlist:', formatApiError(error));
		return { tracks: [], error: error?.message || 'Unknown error' };
	}
}

/**
 * Artist-only generation path. Instead of expanding through related artists,
 * this pulls the selected artist's full discography, scores those tracks
 * against the provided lyric/embedding seeds, keeps the tracks that pass the
 * similarity cutoff, ranks by strongest match, and returns up to 100 refs.
 */
export async function generateArtistPlaylist(
	artist: { id: string; name: string },
	seeds: { id: string; name: string; artist: string[]; album?: string }[],
	userId?: string,
	provider: ProviderName = 'spotify',
	signal?: AbortSignal,
	youtubeGuestCredentials?: ProviderAuthCtx['youtubeGuestCredentials'],
): Promise<{ tracks: ProviderTrackRef[]; error?: string }> {
	const authCtx: ProviderAuthCtx = { userId, youtubeGuestCredentials };
	const throwIfAborted = () => {
		if (signal?.aborted) {
			throw new Error('Aborted');
		}
	};

	try {
		throwIfAborted();
		const token = await getDummyAccessToken();
		setAccessToken(token);
		console.log(
			`Generating artist playlist for ${artist.name} (provider=${provider})...`,
		);

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
						provider,
					},
					signal,
				);
			}),
		);

		throwIfAborted();
		const seedEmbeddings = await getAndParseSeedEmbeddings(
			seedSpotifyIds,
			provider,
		);

		if (!seeds || seeds.length < 5 || seedEmbeddings.length === 0) {
			return {
				tracks: [],
				error:
					'At least 5 seed songs with valid lyrics embeddings are required to generate a playlist.',
			};
		}

		throwIfAborted();
		// For Spotify, `artist.id` is the Spotify artist id. For YouTube the same
		// field is interpreted as a YouTube channel id (artist search is
		// Spotify-only in v1, so the YouTube path here is best-effort).
		const providerImpl = getProvider(provider);
		const discography = await providerImpl.getArtistDiscographyTracks(
			artist.id,
			signal,
			authCtx,
		);
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
		const newTracks: CandidateTrack[] = discography
			.filter((t) => {
				const excluded =
					checkedTrackIds.has(t.externalId) ||
					checkedTrackTitles.has(titleKey(t.name, t.artistName));
				return !excluded;
			})
			.map((t) => ({
				spotifyId: t.externalId,
				name: t.name,
				artistName: t.artistName,
				albumName: t.albumName,
			}));
		const pLimitInstance = pLimit(15);
		const acceptedTracks = await scoreAndFilterTracks(
			newTracks,
			seedEmbeddings,
			checkedTrackIds,
			pLimitInstance,
			signal,
		);
		throwIfAborted();

		const { refs: finalRefs, quotaExhausted } =
			await resolveSpotifyTracksToRefs(acceptedTracks, provider, authCtx);
		const finalTracks = finalRefs.slice(0, 100);

		if (userId) {
			await addGeneratedSongsForUser(
				userId,
				finalTracks.map((r) => r.externalId),
				provider,
			);
		}

		if (quotaExhausted && finalTracks.length <= DB_SIMILAR_SONGS_LIMIT) {
			return { tracks: [], error: YOUTUBE_QUOTA_EXHAUSTED_ERROR };
		}

		return { tracks: finalTracks };
	} catch (error: any) {
		console.error('Error generating artist playlist:', formatApiError(error));
		return { tracks: [], error: error?.message || 'Unknown error' };
	}
}

// TODO: use the same algorithm for the songs coming from the db  - they should be scored and sorted as well
// TODO: split this file into two based on the purpose first if it's the broad path or specific artist part and then make the thngs they share in common into it's own file