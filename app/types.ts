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
	playlistId: string;
	playlistName: string;
	playlistLink: string;
	completedAt: Date | string | null;
	createdAt: Date | string;
};

export type SpotifyTrack = Pick<Song, 'id' | 'title' | 'artist' | 'album'>;
