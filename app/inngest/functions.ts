import {
	generateArtistPlaylist,
	generateSeedPlaylist,
} from '../lib/generateSeedPlaylist';
import { getProvider } from '../lib/providers';
import type { ProviderAuthCtx, ProviderName } from '../lib/providers/types';
import { inngest } from './client';
import prisma from '../lib/prisma';
import { buildArtistPlaylistName } from '../lib/helpers';

export const generatePlaylist = inngest.createFunction(
	{
		id: 'generate-playlist',
		timeouts: { finish: '5m' },
		cancelOn: [
			{
				event: 'playlist/cancel',
				match: 'data.generatedPlaylistId',
			},
		],
	},
	{ event: 'playlist/generate' },
	async ({ event, step, runId }) => {
		const {
			seeds,
			artistNames,
			options,
			userId,
			generatedPlaylistId,
			artistId,
			artistName,
			provider = 'spotify' as ProviderName,
			persistResult = true,
			youtubeGuestCredentials,
		} = event.data;

		const isArtistMode = Boolean(artistId);
		
		const authCtx: ProviderAuthCtx = { userId, youtubeGuestCredentials };

		if (persistResult && generatedPlaylistId) {
			await step.run('save-run-id', async () => {
				const existingRecord = await prisma.generatedPlaylist.findUnique({
					where: { id: generatedPlaylistId },
				});

				await prisma.generatedPlaylist.update({
					where: { id: generatedPlaylistId },
					data: {
						inngestRunId: runId,
						status: 'pending',
						...(existingRecord?.event
							? {}
							: {
									event: {
										name: 'playlist/generate',
										id: event.id,
										data: event.data,
									},
								}),
					},
				});
			});
		}

		const result = await step.run('generate-playlist-tracks', async () => {
			if (isArtistMode) {
				return await generateArtistPlaylist(
					{ id: artistId, name: artistName },
					seeds,
					userId,
					provider,
					undefined,
					youtubeGuestCredentials,
				);
			}
			return await generateSeedPlaylist(
				seeds,
				artistNames,
				options,
				userId,
				provider,
				undefined,
				youtubeGuestCredentials,
			);
		});

		if (result.error || !result.tracks?.length)
			throw new Error(result.error || 'Failed to generate tracks');

		const playlistInfo = await step.run('create-playlist', async () => {
			// Each provider's own createPlaylist/addTracksToPlaylist already
			// authenticates itself (see spotifyProvider/youtubeProvider) — an
			// extra ensureAuth() here would just double the token fetch/refresh.
			const musicProvider = getProvider(provider);
			const playlistName = isArtistMode
				? buildArtistPlaylistName(artistName)
				: (seeds.length > 0
						? 'HearItFresh - Lyrics Inspired'
						: 'HearItFresh - Similar to Playlist') + '@hearitfresh.favour.dev';

			return await musicProvider.createPlaylist(
				playlistName,
				isArtistMode ? artistName : 'Created by HearItFresh',
				authCtx,
			);
		});

		if ('isError' in playlistInfo) throw new Error(String(playlistInfo.err));

		const { externalId, link, name } = playlistInfo;
		const playListID = externalId;

		await step.run('add-tracks-to-playlist', async () => {
			const musicProvider = getProvider(provider);
			await musicProvider.addTracksToPlaylist(result.tracks, playListID, authCtx);
		});

		const playlistOutput = await step.run('finalize-playlist-output', async () => {
			return { link, name };
		});

		if (persistResult && generatedPlaylistId) {
			await step.run('save-playlist-to-db', async () => {
				await prisma.generatedPlaylist.updateMany({
					where: { inngestRunId: runId },
					data: {
						playlistName: name,
						playlistLink: link,
						playlistId: playListID,
						provider,
						status: 'completed',
						errorMessage: null,
						completedAt: new Date(),
					} as any,
				});
			});
		}

		return playlistOutput;
	},
);

export const handleRunCancelled = inngest.createFunction(
	{ id: 'run-cancelled' },
	{ event: 'inngest/function.cancelled' },
	async ({ event, step }) => {
		if (!event.data.function_id.includes('generate-playlist')) {
			return { skipped: true };
		}

		await step.run('rollback-database-state', async () => {
			await prisma.generatedPlaylist.updateMany({
				where: {
					inngestRunId: event.data.run_id,
					status: { not: 'cancelled' },
				},
				data: {
					status: 'cancelled',
					errorMessage: 'Run was manually cancelled',
				},
			});
		});

		return { success: true };
	},
);