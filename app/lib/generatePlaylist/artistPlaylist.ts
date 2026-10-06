'use server';

import { formatApiError } from '../utils';
import { getProvider } from '../providers';
import type { ProviderAuthCtx, ProviderName } from '../providers/types';
import type { GenerationOptions } from '@/app/types';

import pLimit from 'p-limit';
import { setAccessToken } from '../spotifyApi';
import { getDummyAccessToken } from '../spotify-dummy-auth';
import {
	createAbortGuard,
	finalizeTracks,
	prepareSeedEmbeddings,
	resolveSpotifyTracksToRefs,
	scoreTracks,
	selectForResolve,
	titleKey,
	type CandidateTrack,
	type GenerationResult,
	type SeedInput,
} from './shared';
import { loadPlaylistHistory } from './history';

/**
 * Artist-only generation path. Instead of expanding through related artists,
 * this pulls the selected artist's full discography, scores those tracks
 * against the provided lyric/embedding seeds, keeps the tracks that pass the
 * similarity cutoff, ranks by strongest match, and returns up to 100 refs.
 */
export async function generateArtistPlaylist(
	artist: { id: string; name: string },
	seeds: SeedInput[],
	userId?: string,
	provider: ProviderName = 'spotify',
	signal?: AbortSignal,
	youtubeGuestCredentials?: ProviderAuthCtx['youtubeGuestCredentials'],
	filters?: Pick<GenerationOptions, 'themeFilters' | 'paceMix' | 'yearRange'>,
): Promise<GenerationResult> {
	const authCtx: ProviderAuthCtx = { userId, youtubeGuestCredentials };
	const throwIfAborted = createAbortGuard(signal);

	try {
		throwIfAborted();
		const token = await getDummyAccessToken();
		setAccessToken(token);
		console.log(
			`Generating artist playlist for ${artist.name} (provider=${provider})...`,
		);

		const seedSpotifyIds = seeds.map((s) => s.id);

		const prepared = await prepareSeedEmbeddings(
			seeds,
			provider,
			signal,
			filters?.themeFilters,
		);
		if ('error' in prepared) {
			return { tracks: [], error: prepared.error };
		}
		const { seedEmbeddings } = prepared;

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
		const history = await loadPlaylistHistory(userId, provider);
		const checkedTrackIds = new Set<string>([
			...seedSpotifyIds,
			...history.ids,
		]);
		const checkedTrackTitles = new Set<string>(history.titles);
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
				releaseYear: t.releaseYear,
			}));
		const pLimitInstance = pLimit(15);
		const scoredTracks = await scoreTracks(
			newTracks,
			seedEmbeddings,
			pLimitInstance,
			{
				signal,
				themeFilters: filters?.themeFilters,
				yearRange: filters?.yearRange,
			},
		);
		throwIfAborted();

		const { refs, quotaExhausted } = await resolveSpotifyTracksToRefs(
			selectForResolve(scoredTracks, [], filters?.paceMix),
			provider,
			authCtx,
		);

		return await finalizeTracks(refs, {
			quotaExhausted,
			paceMix: filters?.paceMix,
			yearRange: filters?.yearRange,
		});
	} catch (error: any) {
		console.error('Error generating artist playlist:', formatApiError(error));
		return { tracks: [], error: error?.message || 'Unknown error' };
	}
}
