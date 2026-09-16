'use client';

import { Icon } from '@iconify/react/dist/iconify.js';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useAuth } from '@/app/context/authContext';

import ConnectYoutube from '../ConnectYoutube';

const Settings = ({ onClose }: { onClose: () => void }) => {
	const { isGuest, logOut, exitGuestMode } = useAuth();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [onClose]);

	if (!mounted) return null;

	// portalled: the sticky header wrapper is its own stacking context
	return createPortal(
		<section
			role='dialog'
			aria-modal='true'
			aria-label='Settings'
			onClick={onClose}
			className='h-screen w-screen fixed left-0 top-0 bg-slate-500 bg-opacity-60 z-50 flex items-center justify-center'>
			<div
				onClick={(e) => e.stopPropagation()}
				className='mt-6 relative bg-lightest dark:bg-darkest w-[90%] sm:w-3/5 rounded p-6 flex flex-col max-h-[90%] min-w-[300px] gap-4 overflow-y-auto'>
				<div className='flex items-center justify-between sticky top-0 w-full text-fmd pr-2 pb-2'>
					<p>Settings</p>
					<button onClick={onClose} className='flex gap-1 items-center'>
						<Icon icon='iconoir:cancel' width='20' height='20' />
						<span>Close</span>
					</button>
				</div>

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
			</div>
		</section>,
		document.body,
	);
};

export default Settings;
