import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { extractYoutubePlaylistId, getPlaylistTracks } from '../lib/helpers';
import { loadingType, playlistSongDetails } from '../types';

import { useGeneralState } from '../context/generalStateContext';
import { useAuth } from '../context/authContext';

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
	const { user } = useAuth();
	const provider = playListData.provider ?? 'spotify';
	const link =
		provider === 'youtube'
			? extractYoutubePlaylistId(playListData.link)
			: (playListData.link.split('/').at(-1) as string);

	const [loading, setLoading] = useState<loadingType>({
		isLoading: false,
		message: null,
	});
	const [startedEditing, setStartedEditing] = useState(false);
	const [tracks, setTracks] = useState<playlistSongDetails[]>([]);
	const [showingTracks, setShowingTracks] = useState<playlistSongDetails[]>([]);
	const [tracksToRemove, setTracksToRemove] = useState<string[]>([]);
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
		const data = await getPlaylistTracks(link, false, provider, user?.user_id);

		if (!Array.isArray(data)) {
			console.error('Failed to load playlist tracks:', data);
			return;
		}

		const tracks = data.map((item: any) => ({
			id: item.externalId,
			name: item.name,
			artist: [item.artistName],
			image: item.imageUrl,
		}));

		setTracks(tracks);
	}, [link, provider, user?.user_id]);

	const deleteTrack = useCallback(
		(id: string) => {
			setStartedEditing(true);
			setShowingTracks((prevTracks) =>
				prevTracks.filter((track) => track.id !== id),
			);
			const deletingTrack = tracks.filter((track) => track.id === id)[0];

			setTracksDeleted((prev) => [...prev, deletingTrack]);
			setTracksToRemove((prev) => [...prev, id]);
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
			const TracksToRemove = tracksToRemove.filter((id) => !ids.includes(id));

			setTracksToRemove(TracksToRemove);
			setTracksDeleted(remainingDeletedTracks);
			setShowingTracks((prev) => [...prev, ...restoringTracks]);
		},
		[tracks, tracksDeleted, tracksToRemove],
	);

	const saveTracks = useCallback(async () => {
		setLoading({ isLoading: true, message: 'Deleting Tracks....' });
		await fetch('/api/playlist/remove-tracks', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				provider,
				playlistId: link,
				trackIds: tracksToRemove,
				userId: user?.user_id,
			}),
		});

		await getTracks();
		setLoading({ isLoading: false, message: null });
		setTracksToRemove([]);
		setTracksDeleted([]);
		setStartedEditing(false);
	}, [tracksToRemove, provider, link, user?.user_id, getTracks]);

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
