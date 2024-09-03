import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import {
	getAllTracksInAPlaylist,
	removeTracksFromPlaylists,
} from '../lib/spotify';
import { loadingType, playlistSongDetails } from '../types';

import { useGeneralState } from '../context/generalStateContext';

type PlaylistViewContextType = {
	showingTracks: playlistSongDetails[];
	loading: loadingType;
	startedEditing: boolean;
	tracksDeleted: playlistSongDetails[];
	deleteTrack: (id: string) => void;
	restoreAllTracks: () => void;
	restoreSelectedTracks: (ids: string[]) => void;
	saveTracks: () => void;
};

const PlaylistViewContext = createContext<PlaylistViewContextType | undefined>(
	undefined,
);

export const usePlaylistView = () => {
	const context = useContext(PlaylistViewContext);
	if (!context) {
		throw new Error(
			'usePlaylistView must be used within a PlaylistViewProvider',
		);
	}
	return context;
};

export const PlaylistViewProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const { playListData } = useGeneralState();
	const link = playListData.link.split('/').at(-1) as string;

	const [loading, setLoading] = useState<loadingType>({
		isLoading: false,
		message: null,
	});
	const [startedEditing, setStartedEditing] = useState(false);
	const [tracks, setTracks] = useState<playlistSongDetails[]>([]);
	const [showingTracks, setShowingTracks] = useState<playlistSongDetails[]>([]);
	const [tracksToRemove, setTracksToRemove] = useState<{ uri: string }[]>([]);
	const [tracksDeleted, setTracksDeleted] = useState<playlistSongDetails[]>([]);

	useEffect(() => {
		(async () => {
			await getTracks();
		})();
	}, []);

	useEffect(() => {
		if (showingTracks.length === 0) {
			setShowingTracks(tracks);
		}
	}, [showingTracks, tracks]);

	const getTracks = useCallback(async () => {
		const data = await getAllTracksInAPlaylist(link);

		console.log(data);
		const tracks = data.map((item: any) => {
			const track = item.track;
			const image = track.album.images[1].url;
			const artist = track.artists.map((subitem: any) => subitem.name);
			return { id: track.id, name: track.name, artist, image };
		});

		setTracks(tracks);
	}, [link]);

	const deleteTrack = useCallback(
		(id: string) => {
			setStartedEditing(true);
			setShowingTracks((prevTracks) =>
				prevTracks.filter((track) => track.id !== id),
			);
			const deletingTrack = tracks.filter((track) => track.id === id)[0];

			setTracksDeleted((prev) => [...prev, deletingTrack]);
			setTracksToRemove((prev) => [...prev, { uri: 'spotify:track:' + id }]);
		},
		[tracks],
	);

	const restoreAllTracks = useCallback(() => {
		setShowingTracks(tracks);
		setStartedEditing(false);
		setTracksToRemove([]);
		setTracksDeleted([]);
	}, [tracks]);

	const restoreSelectedTracks = useCallback(
		(ids: string[]) => {
			const restoringTracks = tracks.filter((track) => ids.includes(track.id));
			const remainingDeletedTracks = tracksDeleted.filter(
				(track) => !ids.includes(track.id),
			);
			const TracksToRemove = tracksToRemove.filter(
				(track) => !ids.includes(track.uri.split(':').at(-1) as string),
			);

			setTracksToRemove(TracksToRemove);
			setTracksDeleted(remainingDeletedTracks);
			setShowingTracks((prev) => [...prev, ...restoringTracks]);
		},
		[tracks, tracksDeleted, tracksToRemove],
	);

	const saveTracks = useCallback(async () => {
		setLoading({ isLoading: true, message: 'Deleting Tracks....' });
		await removeTracksFromPlaylists(link, tracksToRemove);

		await getTracks();
		setLoading({ isLoading: false, message: null });
		setTracksToRemove([]);
		setTracksDeleted([]);
		setStartedEditing(false);
	}, [tracksToRemove]);

	const value = useMemo(
		() => ({
			showingTracks,
			loading,
			startedEditing,
			tracksDeleted,
			deleteTrack,
			restoreAllTracks,
			saveTracks,
			restoreSelectedTracks,
		}),
		[showingTracks, loading, startedEditing, tracksDeleted],
	);

	return (
		<PlaylistViewContext.Provider value={value}>
			{children}
		</PlaylistViewContext.Provider>
	);
};
