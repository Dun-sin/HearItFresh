import { Song } from './generated/prisma';

export type singleTrack = {
	name: string;
	albumName: string;
	uri: string;
	id: string;
	artistName: string;
};

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

export interface HistoryEntry {
	text: string;
	lastUsed: Date;
	generatedPlaylists?: GeneratedPlaylistHistory[];
}

export type GeneratedPlaylistHistory = {
	playlistId: string | null;
	playlistName: string | null;
	playlistLink: string | null;
	completedAt: Date | string | null;
	createdAt: Date | string;
	status?: string;
	errorMessage?: string | null;
	id?: string;
};

export type SpotifyTrack = Pick<Song, 'id' | 'title' | 'artist' | 'album'>;

export type LRCLibResult = {
	instrumental?: boolean;
	plainLyrics?: string;
	artistName?: string;
	trackName?: string;
};