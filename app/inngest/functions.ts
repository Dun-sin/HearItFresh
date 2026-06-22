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
				match: 'data.jobId',
			},
		],
	},
	{ event: 'playlist/generate' },
	async ({ event, step }) => {
		const { seeds, artistNames, options, userId, jobId, sourcePlaylistId } = event.data;

		// generate tracks
		const result = await step.run('generate-seed-playlist', async () => {
			return await generateSeedPlaylist(
				seeds,
				artistNames,
				options,
				userId,
			);
		});

		if (result.error || !result.tracks?.length)
			throw new Error(result.error || 'Failed to generate tracks');

		// create spotify playlist
		const playlistInfo = await step.run('create-spotify-playlist', async () => {
			const token = await getDummyAccessToken();
			setAccessToken(token);
			const playlistName =
				seeds.length > 0
					? 'HearItFresh - Lyrics Inspired'
					: 'HearItFresh - Similar to Playlist';

			return await createPlayList(
				playlistName,
				'Created by HearItFresh',
			);
		});

		if ('isError' in playlistInfo) throw new Error(playlistInfo.err);

		const { id, link, name } = playlistInfo;
		const playListID = id.substring('spotify:playlist:'.length);
		
		await step.run('add-tracks-to-playlist', async () => {
			const token = await getDummyAccessToken();
			setAccessToken(token);
			await addTracksToPlayList(result.tracks, playListID);
		});

		// Save playlist to database
		await step.run('save-playlist-to-db', async () => {
			await prisma.generatedPlaylist.create({
				data: {
					userId,
					playlistName: name,
					playlistLink: link,
					playlistId: playListID,
					sourcePlaylistId,
					inngestRunId: jobId, // Will be updated with actual runId later
					inngestEventId: '', // Will be set from the status endpoint
					status: 'completed',
					completedAt: new Date(),
				},
			});
		});

		return { link, name };
	},
);
