'use client';

import { useAuth } from '@/app/context/authContext';

import ConnectYoutube from '../ConnectYoutube';
import Modal from '../Modal';

const Settings = ({ onClose }: { onClose: () => void }) => {
	const { isGuest, logOut, exitGuestMode } = useAuth();

	return (
		<Modal title='Settings' onClose={onClose} className='gap-4 overflow-y-auto'>
			<ConnectYoutube />

			<div className='border-t border-gray/40 pt-4'>
				<button
					type='button'
					onClick={() => {
						if (isGuest) exitGuestMode();
						else logOut();
						onClose();
					}}
					className='rounded-lg border-2 border-brand px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-lightest'>
					{isGuest ? 'Sign in' : 'Sign out'}
				</button>
			</div>
		</Modal>
	);
};

export default Settings;
