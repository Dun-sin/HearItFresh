import {
	generateArtistPlaylist,
	generateSeedPlaylist,
} from '../lib/generatePlaylist';
import { getProvider } from '../lib/providers';
import type { ProviderAuthCtx, ProviderName } from '../lib/providers/types';
import { NonRetriableError, RetryAfterError } from 'inngest';
import { inngest } from './client';
import prisma from '../lib/prisma';
import spotifyApi from '../lib/spotifyApi';
import { addGeneratedSongsForUser } from '../lib/db';
import { buildArtistPlaylistName } from '../lib/helpers';

const STALE_PLAYLIST_BATCH_SIZE = 25;
const SPOTIFY_PLAYLIST_PAGE_SIZE = 50;

type OwnedPlaylist = { id: string; name: string };

export const generatePlaylist = inngest.createFunction(
	{
		id: 'generate-playlist',
		timeouts: { finish: '5m' },
		cancelOn: [
			{
				event: 'playlist/cancel',
				match: 'data.cancellationId',
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
					options,
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

		if (!result.tracks?.length)
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

		if (userId) {
			await step.run('save-generated-songs', async () => {
				await addGeneratedSongsForUser(
					userId,
					result.tracks.map((t) => t.externalId),
					provider,
				);
			});
		}

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

function rethrowIfRateLimited(err: unknown) {
	const { statusCode, headers } = (err ?? {}) as {
		statusCode?: number;
		headers?: Record<string, string>;
	};
	if (statusCode === 429) {
		const retryAfterSeconds = Number(headers?.['retry-after']) || 1;
		throw new RetryAfterError('Spotify rate limit hit', retryAfterSeconds * 1000, {
			cause: err,
		});
	}
}

async function listOwnedSpotifyPlaylists(): Promise<OwnedPlaylist[]> {
	await getProvider('spotify').ensureAuth({});
	const { body: me } = await spotifyApi.getMe();
	const owned: OwnedPlaylist[] = [];

	for (let offset = 0; ; offset += SPOTIFY_PLAYLIST_PAGE_SIZE) {
		const { body: page } = await spotifyApi.getUserPlaylists({
			limit: SPOTIFY_PLAYLIST_PAGE_SIZE,
			offset,
		});
		for (const playlist of page.items) {
			if (playlist?.owner?.id === me.id) {
				owned.push({ id: playlist.id, name: playlist.name });
			}
		}
		if (!page.next) break;
	}

	return owned;
}

async function deleteStalePlaylistBatch(
	batch: OwnedPlaylist[],
	cutoff: Date,
	dryRun: boolean,
) {
	await getProvider('spotify').ensureAuth({});

	const records = await prisma.generatedPlaylist.findMany({
		where: { provider: 'spotify', playlistId: { in: batch.map((p) => p.id) } },
		select: { playlistId: true, createdAt: true },
	});
	const createdAtById = new Map(records.map((r) => [r.playlistId, r.createdAt]));

	const result = {
		deleted: [] as string[],
		unknownAge: [] as string[],
		kept: 0,
		failed: [] as { playlist: string; error: string }[],
	};

	for (const playlist of batch) {
		const label = `${playlist.name} (${playlist.id})`;

		try {
			const { body } = await spotifyApi.getPlaylist(playlist.id, {
				fields: 'followers(total),tracks(items(added_at))',
			});
			const firstAddedAt = body.tracks?.items?.[0]?.added_at;
			const createdAt =
				createdAtById.get(playlist.id) ??
				(firstAddedAt ? new Date(firstAddedAt) : null);

			if (!createdAt) {
				result.unknownAge.push(label);
				continue;
			}

			if (createdAt >= cutoff || (body.followers?.total ?? 0) > 0) {
				result.kept++;
				continue;
			}

			if (!dryRun) {
				await spotifyApi.unfollowPlaylist(playlist.id);
				await prisma.generatedPlaylist.deleteMany({
					where: { provider: 'spotify', playlistId: playlist.id },
				});
			}
			result.deleted.push(label);
		} catch (err) {
			rethrowIfRateLimited(err);
			result.failed.push({
				playlist: label,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	}

	return result;
}

export const cleanupStalePlaylists = inngest.createFunction(
	{ id: 'cleanup-stale-playlists', concurrency: 1 },
	{ event: 'playlist/cleanup-stale' },
	async ({ event, step }) => {
		const dryRun = Boolean(event.data?.dryRun);

		const cutoff = await step.run('compute-cutoff', () => {
			const date = new Date();
			date.setMonth(date.getMonth() - 1);
			return date.toISOString();
		});

		const playlists = await step.run('list-owned-playlists', async () => {
			try {
				return await listOwnedSpotifyPlaylists();
			} catch (err) {
				rethrowIfRateLimited(err);
				throw err;
			}
		});

		const results = [];
		for (let i = 0; i < playlists.length; i += STALE_PLAYLIST_BATCH_SIZE) {
			const batch = playlists.slice(i, i + STALE_PLAYLIST_BATCH_SIZE);
			results.push(
				await step.run('process-batch', () =>
					deleteStalePlaylistBatch(batch, new Date(cutoff), dryRun),
				),
			);
		}

		const summary = {
			dryRun,
			scanned: playlists.length,
			deleted: results.flatMap((r) => r.deleted),
			unknownAge: results.flatMap((r) => r.unknownAge),
			kept: results.reduce((sum, r) => sum + r.kept, 0),
			failed: results.flatMap((r) => r.failed),
		};

		if (summary.failed.length > 0) {
			throw new NonRetriableError(
				`${summary.failed.length} playlist(s) failed, ${summary.deleted.length} deleted: ${JSON.stringify(summary.failed)}`,
			);
		}

		return summary;
	},
);