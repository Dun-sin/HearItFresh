import { addTracksToPlayList, createPlayList } from '../lib/spotify';

import { generateSeedPlaylist } from '../lib/generateSeedPlaylist';
import { inngest } from './client';
import { setAccessToken } from '../lib/spotifyApi';
import { getDummyAccessToken } from '../lib/spotify-dummy-auth';
import prisma from '../lib/prisma';

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
		const { seeds, artistNames, options, userId, generatedPlaylistId } =
			event.data;

		await step.run('save-run-id', async () => {
			const existingRecord = await prisma.generatedPlaylist.findUnique({
				where: { id: generatedPlaylistId },
			});

			const existingEventId = (existingRecord?.event as { id?: string } | null)
				?.id;
			const isRetry = existingEventId !== event.id;

			await prisma.generatedPlaylist.update({
				where: { id: generatedPlaylistId },
				data: {
					inngestRunId: runId,
					event: {
						name: 'playlist/generate',
						id: event.id,
						data: event.data,
					},
					status: 'pending',
					...(isRetry && { retryCount: { increment: 1 } }),
					...(isRetry && { errorMessage: null }),
				},
			});
		});

		const result = await step.run('generate-seed-playlist', async () => {
			return await generateSeedPlaylist(seeds, artistNames, options, userId);
		});

		if (result.error || !result.tracks?.length)
			throw new Error(result.error || 'Failed to generate tracks');

		const playlistInfo = await step.run('create-spotify-playlist', async () => {
			const token = await getDummyAccessToken();
			setAccessToken(token);
			const playlistName =
				seeds.length > 0
					? 'HearItFresh - Lyrics Inspired'
					: 'HearItFresh - Similar to Playlist';

			return await createPlayList(playlistName, 'Created by HearItFresh');
		});

		if ('isError' in playlistInfo) throw new Error(playlistInfo.err);

		const { id, link, name } = playlistInfo;
		const playListID = id.substring('spotify:playlist:'.length);

		await step.run('add-tracks-to-playlist', async () => {
			const token = await getDummyAccessToken();
			setAccessToken(token);
			await addTracksToPlayList(result.tracks, playListID);
		});

		await step.run('save-playlist-to-db', async () => {
			await prisma.generatedPlaylist.updateMany({
				where: { inngestRunId: runId },
				data: {
					playlistName: name,
					playlistLink: link,
					playlistId: playListID,
					status: 'completed',
					completedAt: new Date(),
				},
			});
		});

		return { link, name };
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

// TODO: remove the seed details and use the stored info from event data
