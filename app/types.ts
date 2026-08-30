import { Song } from './generated/prisma';
import type { ProviderName } from './lib/providers/types';

export type singleTrack = {
	name: string;
	albumName: string;
	uri: string;
	id: string;
	artistName: string;
};


export type SongInput = Pick<Song, 'id' | 'title' | 'artist' | 'album'> & {
	provider?: ProviderName;
};

export type { ProviderName };

export type trackTypes = singleTrack[];

export type playlistSongDetails = {
	id: string;
	name: string;
	artist: string[];
	image?: string;
};

export type playlistDetails = {
	id: string;
	link: string;
	name: string;
};

export type loadingType = {
	isLoading: boolean;
	message: null | string;
};

export type HistoryKind = 'artist' | 'playlist';

export interface HistoryEntry {
	text: string;
	lastUsed: Date;
	kind?: HistoryKind;
	sourcePlaylist?: SourcePlaylist;
	generatedPlaylists?: GeneratedPlaylistHistory[];
}

export type SourcePlaylist = {
	id: string;
	name: string;
	imageUrl?: string | null;
	totalTracks?: number | null;
};

export type GeneratedPlaylistHistory = {
	playlistId: string | null;
	playlistName: string | null;
	playlistLink: string | null;
	provider?: string | null;
	completedAt: Date | string | null;
	createdAt: Date | string;
	status?: string;
	errorMessage?: string | null;
	retryCount?: number;
	id?: string;
	seeds?: SeedTrackHistory[] | null;
	event?: any;
};

export type SeedTrackHistory = {
	id?: string;
	name?: string;
	artist?: string[] | string;
	album?: string;
	image?: string;
};

export type SpotifyTrack = SongInput;

export type LRCLibResult = {
	instrumental?: boolean;
	plainLyrics?: string;
	artistName?: string;
	trackName?: string;
};
