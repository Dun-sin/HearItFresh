import { Icon } from '@iconify/react/dist/iconify.js';

/**
 * Shown before generating a YouTube Music playlist when there's no existing
 * connection. Styled to match the "View Playlist" modal (OpenOnSpotify/ViewPlaylist.tsx).
 * Unlike a window.open() popup, "Connect" here does a normal full-page
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
		<section className='h-screen w-screen fixed left-0 top-0 bg-slate-500 bg-opacity-60 z-50 flex items-center justify-center'>
			<div className='mt-6 relative bg-lightest dark:bg-darkest w-[90%] sm:w-3/5 rounded p-6 flex flex-col max-h-[90%] min-w-[300px] gap-4'>
				<div className='flex items-center justify-between sticky top-0 w-full text-fmd pr-2 pb-2'>
					<p>Connect your YouTube account</p>
					<button onClick={onCancel} className='flex gap-1 items-center'>
						<Icon icon='iconoir:cancel' width='20' height='20' />
						<span>Close</span>
					</button>
				</div>
				<p className='text-fsm text-dark dark:text-gray'>
					To generate a YouTube Music playlist, HearItFresh needs permission
					to create a playlist in your YouTube account. You'll be taken to
					Google to sign in and approve access, then brought back here.
				</p>
				<button
					type='button'
					onClick={onConnect}
					className='self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-lightest transition-opacity hover:opacity-90'>
					Connect YouTube Music
				</button>
			</div>
		</section>
	);
};

export default ConnectYoutubePrompt;
