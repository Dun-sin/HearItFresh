'use server';

import { formatApiError } from '../utils';
import { getProvider } from '../providers';
import type { ProviderAuthCtx, ProviderName } from '../providers/types';

import pLimit from 'p-limit';
import { setAccessToken } from '../spotifyApi';
import { getDummyAccessToken } from '../spotify-dummy-auth';
import {
	PLAYLIST_SIZE,
	RESOLVE_HEADROOM,
	createAbortGuard,
	finalizeTracks,
	prepareSeedEmbeddings,
	resolveSpotifyTracksToRefs,
	scoreTracks,
	titleKey,
	type CandidateTrack,
	type GenerationResult,
	type SeedInput,
} from './shared';

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

		const prepared = await prepareSeedEmbeddings(seeds, provider, signal);
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
		const checkedTrackIds = new Set<string>(seedSpotifyIds);
		const checkedTrackTitles = new Set<string>();
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
		const scoredTracks = await scoreTracks(
			newTracks,
			seedEmbeddings,
			pLimitInstance,
			signal,
		);
		throwIfAborted();

		const { refs, quotaExhausted } = await resolveSpotifyTracksToRefs(
			scoredTracks.slice(0, PLAYLIST_SIZE + RESOLVE_HEADROOM),
			provider,
			authCtx,
		);

		return await finalizeTracks(refs, { userId, provider, quotaExhausted });
	} catch (error: any) {
		console.error('Error generating artist playlist:', formatApiError(error));
		return { tracks: [], error: error?.message || 'Unknown error' };
	}
}
