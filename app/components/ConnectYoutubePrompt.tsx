import Modal from './Modal';

/**
 * Shown before generating a YouTube Music playlist when there's no existing
 * connection. Unlike a window.open() popup, "Connect" here does a normal full-page
 * redirect to Google's consent screen — window.open + postMessage back turned
 * out to be unreliable: Next.js's default Cross-Origin-Opener-Policy header
 * cuts the popup off from the opener the moment it navigates to accounts.google.com,
 * breaking both the `popup.closed` poll and `window.opener.postMessage`.
 */
const ConnectYoutubePrompt = ({
	onConnect,
	onCancel,
}: {
	onConnect: () => void;
	onCancel: () => void;
}) => {
	return (
		<Modal
			title='Connect your YouTube account'
			onClose={onCancel}
			className='gap-4'>
			<p className='text-fsm text-dark dark:text-gray'>
				To generate a YouTube Music playlist, HearItFresh needs permission to
				create a playlist in your YouTube account. You&apos;ll be taken to
				Google to sign in and approve access, then brought back here.
			</p>
			<button
				type='button'
				onClick={onConnect}
				className='self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-lightest transition-opacity hover:opacity-90'>
				Connect YouTube Music
			</button>
		</Modal>
	);
};

export default ConnectYoutubePrompt;
