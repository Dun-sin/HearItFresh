import { Icon } from '@iconify/react/dist/iconify.js';
import { PlaylistViewProvider } from '@/app/context/PlaylistViewContext';
import StartedEditing from './StartedEditing';
import TrackList from './TrackList';

const OpenPlaylist = ({ handleClick }: { handleClick: () => void }) => {
	return (
		<PlaylistViewProvider>
			<section className='h-screen w-screen fixed left-0 top-0 bg-slate-500 bg-opacity-60 z-50 flex items-center justify-center'>
				<div className='mt-6 relative bg-lightest dark:bg-darkest w-[90%] sm:w-3/5 rounded p-6 flex flex-col max-h-[90%] min-w-[300px]'>
					<div className='flex items-center justify-between sticky top-0 w-full text-fmd pr-2 pb-2'>
						<p>Edit Playlist Generated</p>

						<button onClick={handleClick} className='flex gap-1 items-center'>
							<Icon icon='iconoir:cancel' width='20' height='20' />
							<span>Close</span>
						</button>
					</div>
					<TrackList />
					<StartedEditing />
				</div>
			</section>
		</PlaylistViewProvider>
	);
};

export default OpenPlaylist;
