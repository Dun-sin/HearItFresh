import DeleteOptions from './DeleteOptions';
import RestoreOptions from './RestoreOptions';
import { usePlaylistView } from '@/app/context/PlaylistViewContext';
import useRestoreSongs from '@/app/hooks/useRestoreSongs';

const StartedEditing = () => {
	const { tracksDeleted, startedEditing } = usePlaylistView();
	const {
		restoreOption,
		toggleRestoreOption,
		selectedTracksToRestore,
		handleRestoreSelected,
		handleCheckboxChange,
	} = useRestoreSongs();

	return (
		startedEditing && (
			<div className='pt-4 flex flex-col'>
				<DeleteOptions
					restoreOption={restoreOption}
					toggleRestoreOption={toggleRestoreOption}
				/>
				{restoreOption && (
					<section className='overflow-y-auto'>
						{tracksDeleted.length > 0 && (
							<RestoreOptions
								selectedTracksToRestore={selectedTracksToRestore}
								handleRestoreSelected={handleRestoreSelected}
							/>
						)}
						<div className='grid sm:grid-cols-4 grid-cols-3 gap-y-2 pl-2'>
							{tracksDeleted.map(({ name, id, artist }) => {
								return (
									<label
										key={id}
										htmlFor={name}
										className='flex items-center gap-2'>
										<input
											type='checkbox'
											name={name}
											id={id}
											className='rounded'
											onChange={() => handleCheckboxChange(id)}
										/>
										<div className='flex flex-col justify-between w-full pr-2'>
											<p className='text-fsm truncate'>{name}</p>
											<p className='truncate text-fxs opacity-75'>
												{artist.join(', ')}
											</p>
										</div>
									</label>
								);
							})}
						</div>
					</section>
				)}
			</div>
		)
	);
};

export default StartedEditing;
