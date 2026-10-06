'use server';

import { formatApiError } from '../utils';
import type { GenerationOptions } from '@/app/types';
import type { ProviderAuthCtx, ProviderName } from '../providers/types';
import { setAccessToken } from '../spotifyApi';
import { getDummyAccessToken } from '../spotify-dummy-auth';
import {
	PLAYLIST_SIZE,
	createAbortGuard,
	fillableCount,
	finalizeTracks,
	prepareSeedEmbeddings,
	type GenerationResult,
	type SeedInput,
} from './shared';
import { findDbMatches } from './dbMatches';
import { expandWithRelatedArtists } from './relatedArtists';
import { loadPlaylistHistory } from './history';
import { createPaceBudget } from '../pace/reccobeats';

export async function generateSeedPlaylist(
	seeds: SeedInput[],
	artistNames: string[],
	options: GenerationOptions,
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

		const prepared = await prepareSeedEmbeddings(
			seeds,
			provider,
			signal,
			options?.themeFilters,
		);
		if ('error' in prepared) {
			return { tracks: [], error: prepared.error };
		}
		const { seedEmbeddings } = prepared;
		const paceBudget = createPaceBudget();
		const history = await loadPlaylistHistory(userId, provider);

		const dbMatches = await findDbMatches(
			seedEmbeddings,
			seeds.map((s) => s.id),
			history,
			provider,
			{
				signal,
				themeFilters: options?.themeFilters,
				yearRange: options?.yearRange,
				paceBudget,
			},
		);
		throwIfAborted();

		const paceMix = options?.paceMix;

		if (PLAYLIST_SIZE - fillableCount(dbMatches, paceMix) <= 10) {
			return await finalizeTracks(dbMatches, {
				quotaExhausted: false,
				paceMix,
				yearRange: options?.yearRange,
			});
		}

		const { refs, quotaExhausted } = await expandWithRelatedArtists({
			seeds,
			artistNames,
			options,
			seedEmbeddings,
			existing: dbMatches,
			history,
			provider,
			authCtx,
			paceBudget,
			signal,
		});

		return await finalizeTracks(refs, {
			quotaExhausted,
			paceMix,
			yearRange: options?.yearRange,
		});
	} catch (error: any) {
		console.error('Error generating seed playlist:', formatApiError(error));
		return { tracks: [], error: error?.message || 'Unknown error' };
	}
}
