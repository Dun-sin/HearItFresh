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

export type SpotifyTrack = Pick<Song, 'id' | 'title' | 'artist' | 'album'>;

export type LRCLibResult = {
	instrumental?: boolean;
	plainLyrics?: string;
	artistName?: string;
	trackName?: string;
};
export type GuestGeneration = {
	runId: string | null;
	eventId: string | null;
	link?: string | null;
	name?: string | null;
	startedAt: number;
};
