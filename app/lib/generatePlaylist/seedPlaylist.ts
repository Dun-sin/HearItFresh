'use server';

import { formatApiError } from '../utils';
import type { ProviderAuthCtx, ProviderName } from '../providers/types';
import { setAccessToken } from '../spotifyApi';
import { getDummyAccessToken } from '../spotify-dummy-auth';
import {
	PLAYLIST_SIZE,
	createAbortGuard,
	finalizeTracks,
	prepareSeedEmbeddings,
	type GenerationResult,
	type SeedInput,
} from './shared';
import { findDbMatches } from './dbMatches';
import { expandWithRelatedArtists } from './relatedArtists';

export async function generateSeedPlaylist(
	seeds: SeedInput[],
	artistNames: string[],
	options: { isNotPopular: boolean; isDifferent: boolean },
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
		console.log(`Generating seed playlist (provider=${provider})...`);

		const prepared = await prepareSeedEmbeddings(seeds, provider, signal);
		if ('error' in prepared) {
			return { tracks: [], error: prepared.error };
		}
		const { seedEmbeddings } = prepared;

		const dbMatches = await findDbMatches(
			seedEmbeddings,
			seeds.map((s) => s.id),
			userId,
			provider,
		);
		throwIfAborted();

		if (PLAYLIST_SIZE - dbMatches.length <= 10) {
			return await finalizeTracks(dbMatches, {
				userId,
				provider,
				quotaExhausted: false,
			});
		}

		const { refs, quotaExhausted } = await expandWithRelatedArtists({
			seeds,
			artistNames,
			options,
			seedEmbeddings,
			existing: dbMatches,
			provider,
			authCtx,
			signal,
		});

		return await finalizeTracks(refs, { userId, provider, quotaExhausted });
	} catch (error: any) {
		console.error('Error generating seed playlist:', formatApiError(error));
		return { tracks: [], error: error?.message || 'Unknown error' };
	}
}
