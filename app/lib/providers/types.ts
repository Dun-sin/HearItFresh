import type { Song } from '../../generated/prisma';

export type ProviderName = 'spotify' | 'youtube';

export type YoutubeGuestCredentials = {
	accessToken: string;
	refreshToken: string;
	expiresAt: string;
};

export type ProviderAuthCtx = {
	userId?: string | null;
	youtubeGuestCredentials?: YoutubeGuestCredentials | null;
};

export type ProviderTrackRef = { provider: ProviderName; externalId: string };

export type ProviderTrack = ProviderTrackRef & {
	name: string;
	albumName?: string;
	artistName: string;
	imageUrl?: string | null;
};

export type ProviderPlaylist = {
	provider: ProviderName;
	externalId: string;
	link: string;
	name: string;
};

export interface MusicProvider {
	readonly name: ProviderName;

	ensureAuth(ctx: { userId?: string | null }): Promise<void>;

	createPlaylist(
		name: string,
		description: string,
		ctx: ProviderAuthCtx,
	): Promise<ProviderPlaylist | { isError: true; err: unknown }>;

	addTracksToPlaylist(
		tracks: ProviderTrackRef[],
		playlistExternalId: string,
		ctx: ProviderAuthCtx,
	): Promise<void>;

	removeTracksFromPlaylist(
		tracks: ProviderTrackRef[],
		playlistExternalId: string,
		ctx: ProviderAuthCtx,
	): Promise<void>;

	searchArtist(
		name: string,
		ctx?: ProviderAuthCtx,
	): Promise<{ id: string; name: string } | null>;

	getArtistDiscographyTracks(
		artistId: string,
		signal?: AbortSignal,
		ctx?: ProviderAuthCtx,
	): Promise<ProviderTrack[]>;

	getPlaylistDetails(
		externalId: string,
		ctx?: ProviderAuthCtx,
	): Promise<{
		id: string;
		name: string;
		imageUrl?: string | null;
		totalTracks?: number | null;
	} | null>;

	getAllTracksInPlaylist(
		externalId: string,
		ctx?: ProviderAuthCtx,
	): Promise<ProviderTrack[]>;

	searchTrackVideo?(
		track: { name: string; artistName: string; albumName?: string },
		ctx?: ProviderAuthCtx,
	): Promise<string | null>;
}

export type { Song };
