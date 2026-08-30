import {
	createPlayList,
	addTracksToPlayList,
	removeTracksFromPlaylists,
	getArtistDiscographyTracks as spotifyGetArtistDiscography,
	getPlaylistDetails as spotifyGetPlaylistDetails,
	getAllTracksInAPlaylist,
} from '../../spotify';
import spotifyApi, { setAccessToken } from '../../spotifyApi';
import { getDummyAccessToken } from '../../spotify-dummy-auth';
import type {
	MusicProvider,
	ProviderAuthCtx,
	ProviderPlaylist,
	ProviderTrack,
	ProviderTrackRef,
} from '../types';

const SPOTIFY_PLAYLIST_URI_PREFIX = 'spotify:playlist:';
const SPOTIFY_TRACK_URI_PREFIX = 'spotify:track:';

const stripPlaylistPrefix = (uri: string) =>
	uri.startsWith(SPOTIFY_PLAYLIST_URI_PREFIX)
		? uri.slice(SPOTIFY_PLAYLIST_URI_PREFIX.length)
		: uri;

async function ensureAuth(): Promise<void> {
	const token = await getDummyAccessToken();
	setAccessToken(token);
}

async function createPlaylist(
	name: string,
	description: string,
	_ctx: ProviderAuthCtx,
): Promise<ProviderPlaylist | { isError: true; err: unknown }> {
	await ensureAuth();
	const res = await createPlayList(name, description);
	if ('isError' in res) return { isError: true, err: res.err };
	return {
		provider: 'spotify',
		externalId: stripPlaylistPrefix(res.id),
		link: res.link,
		name: res.name,
	};
}

async function addTracksToPlaylist(
	tracks: ProviderTrackRef[],
	playlistExternalId: string,
	_ctx: ProviderAuthCtx,
): Promise<void> {
	await ensureAuth();
	const uris = tracks.map((t) => `${SPOTIFY_TRACK_URI_PREFIX}${t.externalId}`);
	await addTracksToPlayList(uris, playlistExternalId);
}

async function removeTracksFromPlaylist(
	tracks: ProviderTrackRef[],
	playlistExternalId: string,
	_ctx: ProviderAuthCtx,
): Promise<void> {
	await ensureAuth();
	const uris = tracks.map((t) => ({
		uri: `${SPOTIFY_TRACK_URI_PREFIX}${t.externalId}`,
	}));
	await removeTracksFromPlaylists(playlistExternalId, uris);
}

async function searchArtist(
	name: string,
	_ctx?: ProviderAuthCtx,
): Promise<{ id: string; name: string } | null> {
	await ensureAuth();
	try {
		const data = await spotifyApi.searchArtists(name, { limit: 1 });
		const match = data.body.artists?.items?.[0];
		return match ? { id: match.id, name: match.name } : null;
	} catch (e) {
		console.error('Spotify searchArtist failed', e);
		return null;
	}
}

async function getArtistDiscographyTracks(
	artistId: string,
	signal?: AbortSignal,
	_ctx?: ProviderAuthCtx,
): Promise<ProviderTrack[]> {
	await ensureAuth();
	const tracks = await spotifyGetArtistDiscography(artistId, signal);
	return tracks.map((t) => ({
		provider: 'spotify',
		externalId: t.id,
		name: t.name,
		albumName: t.albumName,
		artistName: t.artistName,
	}));
}

async function getPlaylistDetails(
	externalId: string,
	_ctx?: ProviderAuthCtx,
) {
	await ensureAuth();
	const details: any = await spotifyGetPlaylistDetails(externalId);
	if (!details || typeof details !== 'object' || 'message' in details)
		return null;
	return {
		id: externalId,
		name: details.name,
		imageUrl: details.imageUrl ?? null,
		totalTracks: details.totalTracks ?? null,
	};
}

async function getAllTracksInPlaylist(
	externalId: string,
	_ctx?: ProviderAuthCtx,
): Promise<ProviderTrack[]> {
	await ensureAuth();
	const items = await getAllTracksInAPlaylist(externalId);
	if (!Array.isArray(items)) return [];
	return items
		.map((item: any) => item?.track)
		.filter(Boolean)
		.map((track: any) => ({
			provider: 'spotify' as const,
			externalId: track.id,
			name: track.name,
			albumName: track.album?.name,
			artistName: track.artists?.[0]?.name ?? 'Unknown Artist',
			imageUrl: track.album?.images?.[0]?.url ?? null,
		}));
}

export const spotifyProvider: MusicProvider = {
	name: 'spotify',
	ensureAuth,
	createPlaylist,
	addTracksToPlaylist,
	removeTracksFromPlaylist,
	searchArtist,
	getArtistDiscographyTracks,
	getPlaylistDetails,
	getAllTracksInPlaylist,
};
