import { resolveYoutubeAccessToken } from './auth';
import {
	createPlaylist as ytCreatePlaylist,
	addVideoToPlaylist as ytAddVideoToPlaylist,
	deletePlaylistItem as ytDeletePlaylistItem,
	searchVideo as ytSearchVideo,
	searchChannel as ytSearchChannel,
	listChannelVideos as ytListChannelVideos,
	getPlaylistDetails as ytGetPlaylistDetails,
	getPlaylistItems as ytGetPlaylistItems,
} from './client';
import { cleanMusicMetadata, formatApiError } from '../../utils';
import type {
	MusicProvider,
	ProviderAuthCtx,
	ProviderPlaylist,
	ProviderTrack,
	ProviderTrackRef,
} from '../types';

const MAX_DISCOGRAPHY_PAGES = 3;

const normalizeArtistName = (channelTitle: string) =>
	channelTitle.replace(/\s*-\s*topic\s*$/i, '').trim() || channelTitle;

const normalizeTrackName = (title: string) => cleanMusicMetadata(title) || title;

async function token(ctx?: ProviderAuthCtx): Promise<string> {
	return resolveYoutubeAccessToken(ctx ?? {});
}

async function ensureAuth(ctx: ProviderAuthCtx): Promise<void> {
	await resolveYoutubeAccessToken(ctx);
}

async function createPlaylist(
	name: string,
	description: string,
	ctx: ProviderAuthCtx,
): Promise<ProviderPlaylist | { isError: true; err: unknown }> {
	try {
		const accessToken = await token(ctx);
		const created = await ytCreatePlaylist(accessToken, name, description);
		return {
			provider: 'youtube',
			externalId: created.id,
			link: created.link,
			name: created.name,
		};
	} catch (err) {
		return { isError: true, err };
	}
}

async function addTracksToPlaylist(
	tracks: ProviderTrackRef[],
	playlistExternalId: string,
	ctx: ProviderAuthCtx,
): Promise<void> {
	const accessToken = await token(ctx);
	const errors: unknown[] = [];

	for (const track of tracks) {
		try {
			await ytAddVideoToPlaylist(
				accessToken,
				playlistExternalId,
				track.externalId,
			);
		} catch (e) {
			errors.push(e);
			console.error(
				`YouTube: failed to add video ${track.externalId}: ${formatApiError(e)}`,
			);
		}
	}

	if (errors.length === tracks.length && tracks.length > 0) {
		throw new Error(
			`Failed to add any of the ${tracks.length} tracks to the YouTube playlist`,
		);
	}
	if (errors.length > 0) {
		console.warn(
			`YouTube: added ${tracks.length - errors.length}/${tracks.length} tracks; ${errors.length} failed`,
		);
	}
}

async function removeTracksFromPlaylist(
	tracks: ProviderTrackRef[],
	playlistExternalId: string,
	ctx: ProviderAuthCtx,
): Promise<void> {
	const accessToken = await token(ctx);
	const videoIds = new Set(tracks.map((t) => t.externalId));

	const itemIdsToDelete: string[] = [];
	let pageToken: string | undefined;
	do {
		const { items, nextPageToken } = await ytGetPlaylistItems(
			accessToken,
			playlistExternalId,
			pageToken,
		);
		for (const item of items) {
			if (item.videoId && item.itemId && videoIds.has(item.videoId)) {
				itemIdsToDelete.push(item.itemId);
			}
		}
		pageToken = nextPageToken;
	} while (pageToken && itemIdsToDelete.length < videoIds.size);

	const errors: unknown[] = [];
	for (const itemId of itemIdsToDelete) {
		try {
			await ytDeletePlaylistItem(accessToken, itemId);
		} catch (e) {
			errors.push(e);
			console.error(
				`YouTube: failed to remove item ${itemId}: ${formatApiError(e)}`,
			);
		}
	}
	if (errors.length > 0) {
		throw new Error(
			`Failed to remove ${errors.length}/${itemIdsToDelete.length} tracks from YouTube playlist`,
		);
	}
}

async function searchArtist(
	name: string,
	ctx?: ProviderAuthCtx,
): Promise<{ id: string; name: string } | null> {
	const accessToken = await token(ctx);
	return ytSearchChannel(accessToken, name);
}

async function getArtistDiscographyTracks(
	artistId: string,
	_signal?: AbortSignal,
	ctx?: ProviderAuthCtx,
): Promise<ProviderTrack[]> {
	const accessToken = await token(ctx);
	const tracks: ProviderTrack[] = [];
	let pageToken: string | undefined;
	for (let page = 0; page < MAX_DISCOGRAPHY_PAGES; page++) {
		const { videos, nextPageToken } = await ytListChannelVideos(
			accessToken,
			artistId,
			pageToken,
		);
		for (const v of videos) {
			if (!v.videoId) continue;
			tracks.push({
				provider: 'youtube',
				externalId: v.videoId,
				name: normalizeTrackName(v.title),
				artistName: normalizeArtistName(v.channelTitle),
				imageUrl: v.thumbnailUrl,
			});
		}
		if (!nextPageToken) break;
		pageToken = nextPageToken;
	}
	return tracks;
}

async function getPlaylistDetails(
	externalId: string,
	ctx?: ProviderAuthCtx,
) {
	const accessToken = await token(ctx);
	return ytGetPlaylistDetails(accessToken, externalId);
}

async function getAllTracksInPlaylist(
	externalId: string,
	ctx?: ProviderAuthCtx,
): Promise<ProviderTrack[]> {
	const accessToken = await token(ctx);
	const tracks: ProviderTrack[] = [];
	let pageToken: string | undefined;
	do {
		const { items, nextPageToken } = await ytGetPlaylistItems(
			accessToken,
			externalId,
			pageToken,
		);
		for (const item of items) {
			if (!item.videoId) continue;
			tracks.push({
				provider: 'youtube',
				externalId: item.videoId,
				name: normalizeTrackName(item.title),
				artistName: normalizeArtistName(item.channelTitle),
				imageUrl: item.thumbnailUrl,
			});
		}
		pageToken = nextPageToken;
	} while (pageToken);
	return tracks;
}

async function searchTrackVideo(
	track: { name: string; artistName: string; albumName?: string },
	ctx?: ProviderAuthCtx,
): Promise<string | null> {
	const accessToken = await token(ctx);
	const query = `${track.name} ${track.artistName}`.trim();
	return ytSearchVideo(accessToken, query);
}

export const youtubeProvider: MusicProvider = {
	name: 'youtube',
	ensureAuth,
	createPlaylist,
	addTracksToPlaylist,
	removeTracksFromPlaylist,
	searchArtist,
	getArtistDiscographyTracks,
	getPlaylistDetails,
	getAllTracksInPlaylist,
	searchTrackVideo,
};
