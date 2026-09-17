import Modal from './Modal';

const YoutubeChannelRequiredPrompt = ({ onClose }: { onClose: () => void }) => {
	return (
		<Modal
			title='You need a YouTube channel'
			onClose={onClose}
			className='gap-4'>
			<p className='text-fsm text-dark dark:text-gray'>
				Your YouTube account is connected, but it doesn&apos;t have a YouTube
				channel yet. YouTube only lets accounts with a channel save playlists,
				so HearItFresh can&apos;t create your playlist until you make one.
			</p>
			<a
				href='https://www.youtube.com/create_channel'
				target='_blank'
				rel='noopener noreferrer'
				className='self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-lightest transition-opacity hover:opacity-90'>
				Create a YouTube channel
			</a>
		</Modal>
	);
};

export default YoutubeChannelRequiredPrompt;
