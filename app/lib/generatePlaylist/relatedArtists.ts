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
	RESOLVE_HEADROOM,
	createAbortGuard,
	resolveSpotifyTracksToRefs,
	scoreTracks,
	titleKey,
	type CandidateTrack,
	type RankedRef,
	type ResolvedRefs,
	type SeedInput,
} from './shared';
import type { DbMatch } from './dbMatches';

export async function expandWithRelatedArtists({
	seeds,
	artistNames,
	options,
	seedEmbeddings,
	existing,
	provider,
	authCtx,
	signal,
}: {
	seeds: SeedInput[];
	artistNames: string[];
	options: GenerationOptions;
	seedEmbeddings: number[][];
	existing: DbMatch[];
	provider: ProviderName;
	authCtx: ProviderAuthCtx;
	signal?: AbortSignal;
}): Promise<ResolvedRefs> {
	const throwIfAborted = createAbortGuard(signal);

	let hitQuotaLimit = false;
	const accumulatedRefs: RankedRef[] = [...existing];
	const checkedTrackIds = new Set<string>(existing.map((r) => r.externalId));
	const checkedTrackTitles = new Set<string>(
		existing.map((r) => titleKey(r.title, r.artist)),
	);
	const usedArtistNames: string[] = [];

	for (let attempt = 0; attempt < 2; attempt++) {
		if (accumulatedRefs.length >= PLAYLIST_SIZE) break;
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
			);
			throwIfAborted();

			const acceptedTracks = scoredTracks.slice(
				0,
				PLAYLIST_SIZE - accumulatedRefs.length + RESOLVE_HEADROOM,
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
