import { Icon } from '@iconify/react/dist/iconify.js';
import { usePlaylistView } from '@/app/context/PlaylistViewContext';

type DeleteOptionsTypes = {
	restoreOption: boolean;
	toggleRestoreOption: () => void;
};

const DeleteOptions = ({
	restoreOption,
	toggleRestoreOption,
}: DeleteOptionsTypes) => {
	const { saveTracks, loading } = usePlaylistView();

	return (
		<div className='flex items-center gap-2 ml-auto'>
			<button
				onClick={toggleRestoreOption}
				className='flex items-center gap-1 text-fsm sm:text-fbase'>
				<span>Select Songs to Restore</span>
				{restoreOption ? (
					<Icon icon='mingcute:up-line' />
				) : (
					<Icon icon='mingcute:down-line' />
				)}
			</button>
			<button
				onClick={saveTracks}
				disabled={loading.isLoading}
				className='bg-brand px-4 py-1 rounded text-lightest text-fsm sm:text-fbase'>
				{loading.isLoading ? loading.message : 'Save'}
			</button>
		</div>
	);
};

export default DeleteOptions;
