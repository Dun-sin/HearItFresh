import TrackListItem from './TrackListItem';
import { usePlaylistView } from '@/app/context/PlaylistViewContext';

const TrackList = () => {
	const { showingTracks } = usePlaylistView();

	return (
		<ul className='h-96 overflow-y-scroll px-4 list-decimal flex flex-col gap-2'>
			{showingTracks.map((item) => {
				return <TrackListItem item={item} key={item.id} />;
			})}
		</ul>
	);
};

export default TrackList;
