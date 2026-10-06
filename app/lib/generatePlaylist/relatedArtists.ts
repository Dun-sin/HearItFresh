import { formatApiError } from '../utils';
import {
	getAllTracks,
	getEveryAlbum,
	relatedArists,
	artistNameOf,
} from '../helpers';
import type { GenerationOptions } from '@/app/types';
import type { ProviderAuthCtx, ProviderName } from '../providers/types';

import pLimit from 'p-limit';
import {
	PLAYLIST_SIZE,
	createAbortGuard,
	fillableCount,
	resolveSpotifyTracksToRefs,
	scoreTracks,
	selectForResolve,
	titleKey,
	type CandidateTrack,
	type RankedRef,
	type ResolvedRefs,
	type SeedInput,
} from './shared';
import type { DbMatch } from './dbMatches';
import { hasPaceMix } from '../pace/mix';
import { hasActiveThemeFilter } from '../themes/filter';
import type { PaceBudget } from '../pace/reccobeats';

const PACED_FETCH = { maxArtists: 160, albumsPerArtist: 2 };
const THEMED_FETCH = { maxArtists: 160, albumsPerArtist: 3 };

export async function expandWithRelatedArtists({
	seeds,
	artistNames,
	options,
	seedEmbeddings,
	existing,
	provider,
	authCtx,
	paceBudget,
	signal,
}: {
	seeds: SeedInput[];
	artistNames: string[];
	options: GenerationOptions;
	seedEmbeddings: number[][];
	existing: DbMatch[];
	provider: ProviderName;
	authCtx: ProviderAuthCtx;
	paceBudget: PaceBudget;
	signal?: AbortSignal;
}): Promise<ResolvedRefs> {
	const throwIfAborted = createAbortGuard(signal);

	let hitQuotaLimit = false;
	const accumulatedRefs: RankedRef[] = [...existing];
	const checkedTrackIds = new Set<string>(existing.map((r) => r.externalId));
	const checkedTrackTitles = new Set<string>(
		existing.map((r) => titleKey(r.title, r.artistName)),
	);
	const usedArtistNames: string[] = [];

	const paced = hasPaceMix(options?.paceMix);
	const attempts = paced ? 1 : 2;
	const fetchLimits = paced
		? PACED_FETCH
		: hasActiveThemeFilter(options?.themeFilters)
			? THEMED_FETCH
			: undefined;

	for (let attempt = 0; attempt < attempts; attempt++) {
		if (fillableCount(accumulatedRefs, options?.paceMix) >= PLAYLIST_SIZE)
			break;
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
				fetchLimits?.maxArtists,
			);
			throwIfAborted();

			usedArtistNames.push(...finalList.map(artistNameOf));

			const albums = await getEveryAlbum(
				finalList,
				signal,
				fetchLimits?.albumsPerArtist,
			);
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
				.map(
					(t: any): CandidateTrack => ({
						spotifyId: t.id,
						name: t.name,
						artistName: t.artistName,
						albumName: t.albumName,
					}),
				);

			const pLimitInstance = pLimit(15);
			const scoredTracks = await scoreTracks(
				newTracks,
				seedEmbeddings,
				pLimitInstance,
				signal,
				options?.themeFilters,
				paceBudget,
			);
			throwIfAborted();

			const acceptedTracks = selectForResolve(
				scoredTracks,
				accumulatedRefs,
				options?.paceMix,
			);

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

	return { refs: accumulatedRefs, quotaExhausted: hitQuotaLimit };
}
