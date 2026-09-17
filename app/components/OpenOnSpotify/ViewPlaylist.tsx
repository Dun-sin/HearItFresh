import { PlaylistViewProvider } from '@/app/context/PlaylistViewContext';
import Modal from '../Modal';
import StartedEditing from './StartedEditing';
import TrackList from './TrackList';

const ViewPlaylist = ({ handleClick }: { handleClick: () => void }) => {
	return (
		<PlaylistViewProvider>
			<Modal title='Edit Playlist Generated' onClose={handleClick}>
				<TrackList />
				<StartedEditing />
			</Modal>
		</PlaylistViewProvider>
	);
};

export default ViewPlaylist;
