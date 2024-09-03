import React from 'react';
import { usePlaylistView } from '@/app/context/PlaylistViewContext';

type RestoreOptionsTypes = {
	selectedTracksToRestore: string[];
	handleRestoreSelected: () => void;
};

const RestoreOptions = ({
	selectedTracksToRestore,
	handleRestoreSelected,
}: RestoreOptionsTypes) => {
	const { restoreAllTracks } = usePlaylistView();

	return (
		<div className='flex items-center gap-5'>
			<button
				onClick={restoreAllTracks}
				className='border-brand border-2 px-4 py-1 rounded text-fsm mb-3 transition-all hover:bg-brand hover:text-lightest'>
				Restore All
			</button>
			{selectedTracksToRestore.length > 0 && (
				<button
					className='border-brand border-2 px-4 py-1 rounded text-fsm mb-3 transition-all hover:bg-brand hover:text-lightest'
					onClick={handleRestoreSelected}>
					Restore Selected
				</button>
			)}
		</div>
	);
};

export default RestoreOptions;
