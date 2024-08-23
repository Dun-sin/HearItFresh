import {
	getAllTracksInAPlaylist,
	removeTracksFromPlaylists,
} from '../lib/spotify';
import { loadingType, playlistSongDetails } from '../types';
import { useEffect, useState } from 'react';

const useViewPlaylist = (
	link: string,
): {
	showingTracks: playlistSongDetails[];
	loading: loadingType;
	startedEditing: boolean;
	tracksDeleted: playlistSongDetails[];
	deleteTrack: (id: string) => void;
	restoreAllTracks: () => void;
	restoreSelectedTracks: (ids: string[]) => void;
	saveTracks: () => void;
} => {
	link = link.split('/').at(-1) as string;

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
	}, [tracks]);

	const getTracks = async () => {
		const data = await getAllTracksInAPlaylist(link);

		const tracks = data.map((item: any) => {
			const track = item.track;
			const image = track.album.images[1].url;
			const artist = track.artists.map((subitem: any) => subitem.name);
			return { id: track.id, name: track.name, artist, image };
		});

		setTracks(tracks);
	};

	const deleteTrack = (id: string) => {
		setStartedEditing(true);
		setShowingTracks((prevTracks) =>
			prevTracks.filter((track) => track.id !== id),
		);
		const deletingTrack = tracks.filter((track) => track.id === id)[0];
		setTracksDeleted([...tracksDeleted, deletingTrack]);
		setTracksToRemove([...tracksToRemove, { uri: 'spotify:track:' + id }]);
	};

	const restoreAllTracks = () => {
		setShowingTracks(tracks);
		setStartedEditing(false);
		setTracksToRemove([]);
		setTracksDeleted([]);
	};

	const restoreSelectedTracks = (ids: string[]) => {
		const restoringTracks = tracks.filter((track) => ids.includes(track.id));
		const remainingDeletedTracks = tracksDeleted.filter(
			(track) => !ids.includes(track.id),
		);
		const TracksToRemove = tracksToRemove.filter((track) =>
			ids.includes(track.uri.split(':').at(-1) as string),
		);

		setTracksToRemove(TracksToRemove);
		setTracksDeleted(remainingDeletedTracks);
		setShowingTracks([...showingTracks, ...restoringTracks]);
	};

	const saveTracks = async () => {
		setLoading({ isLoading: true, message: 'Deleting Tracks....' });
		removeTracksFromPlaylists(link, tracksToRemove);

		await getTracks();
		setLoading({ isLoading: false, message: null });
		setTracksToRemove([]);
		setTracksDeleted([]);
		setStartedEditing(false);
	};

	return {
		showingTracks,
		loading,
		startedEditing,
		deleteTrack,
		restoreAllTracks,
		saveTracks,
		restoreSelectedTracks,
		tracksDeleted,
	};
};

export default useViewPlaylist;
