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
	deleteTrack: (id: string) => void;
	restoreTracks: () => void;
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

	useEffect(() => {
		getTracks();
	}, [tracks]);

	useEffect(() => {
		if (showingTracks.length === 0) {
			setShowingTracks(tracks);
		}
	}, [tracks]);
	const getTracks = async () => {
		const data = await getAllTracksInAPlaylist(link);
		const tracks = data.map((item: any) => {
			const track = item.track;
			const artist = track.artists.map((subitem: any) => subitem.name);
			return { id: track.id, name: track.name, artist };
		});

		setTracks(tracks);
	};

	const deleteTrack = (id: string) => {
		setStartedEditing(true);
		setShowingTracks((prevTracks) =>
			prevTracks.filter((track) => track.id !== id),
		);
		setTracksToRemove([...tracksToRemove, { uri: 'spotify:track:' + id }]);
	};

	const restoreTracks = () => setShowingTracks(tracks);
	const saveTracks = () => {
		setLoading({ isLoading: true, message: 'Saving Tracks....' });
		removeTracksFromPlaylists(link, tracksToRemove);
		setLoading({ isLoading: false, message: null });
		setStartedEditing(false);
	};

	return {
		showingTracks,
		loading,
		startedEditing,
		deleteTrack,
		restoreTracks,
		saveTracks,
	};
};

export default useViewPlaylist;
