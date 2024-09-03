import { usePlaylistView } from '../context/PlaylistViewContext';
import { useState } from 'react';

const useRestoreSongs = () => {
	const { restoreSelectedTracks } = usePlaylistView();
	const [selectedTracksToRestore, setSelectedTracksToRestore] = useState<
		string[]
	>([]);
	const [restoreOption, setRestoreOption] = useState(false);

	const handleCheckboxChange = (id: string) => {
		setSelectedTracksToRestore((prevSelectedTracks) => {
			if (prevSelectedTracks.includes(id)) {
				return prevSelectedTracks.filter((trackId) => trackId !== id);
			} else {
				return [...prevSelectedTracks, id];
			}
		});
	};

	const handleRestoreSelected = () => {
		restoreSelectedTracks(selectedTracksToRestore);
		setSelectedTracksToRestore([]);
	};

	const toggleRestoreOption = () => {
		setRestoreOption(!restoreOption);
	};

	return {
		restoreOption,
		selectedTracksToRestore,
		handleCheckboxChange,
		handleRestoreSelected,
		toggleRestoreOption,
	};
};

export default useRestoreSongs;
