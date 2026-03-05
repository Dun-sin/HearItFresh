export type singleTrack = { name: string; albumName: string; uri: string; id: string; artistName: string; };

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
}

export interface Song {
	id: string;
	title: string;
	artist: string;
	album: string;
	spotifyId: string;
	lyrics: string;
}

export interface SpotifyTrack {
	id: string
  title: string
  artist: string
  album?: string
}