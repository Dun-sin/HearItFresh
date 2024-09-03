import { Icon } from '@iconify/react/dist/iconify.js';
import Image from 'next/image';
import { playlistSongDetails } from '@/app/types';
import { usePlaylistView } from '@/app/context/PlaylistViewContext';

const TrackListItem = ({ item }: { item: playlistSongDetails }) => {
	const { artist, id, name, image } = item;
	const { deleteTrack } = usePlaylistView();

	return (
		<li className='flex items-center justify-between sm:gap-4 gap-2'>
			<section className='flex sm:gap-4 gap-2 w-[75%] min-w-[150px] sm:min-w-[350px] pr-2 hover:opacity-45'>
				<div className='sm:min-h-10 sm:min-w-10 min-h-7 min-w-7 relative rounded-md overflow-hidden'>
					<Image src={image as string} alt={name + ' track image'} fill />
				</div>
				<div className='w-full'>
					<p className='text-fbase truncate'>{name}</p>
					<p className='truncate text-fsm opacity-75 -mt-1'>
						{artist.join(', ')}
					</p>
				</div>
			</section>
			<button
				className='flex items-center gap-1 hover:bg-red-500 transition-all bg-red-600 bg-opacity-65 text-lightest rounded px-2.5 py-1.5 sm:text-fbase text-fsm'
				onClick={() => deleteTrack(id)}>
				<Icon icon='mdi:delete' width='18' height='18' />
				<span>Delete</span>
			</button>
		</li>
	);
};

export default TrackListItem;
