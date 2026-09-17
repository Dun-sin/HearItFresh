'use client';

import { Icon } from '@iconify/react/dist/iconify.js';
import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({
	title,
	onClose,
	className = '',
	children,
}: {
	title: string;
	onClose: () => void;
	className?: string;
	children: ReactNode;
}) => {
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

	// portalled: ancestors like the sticky header create their own stacking context
	return createPortal(
		<section
			role='dialog'
			aria-modal='true'
			aria-label={title}
			onClick={onClose}
			className='h-screen w-screen fixed left-0 top-0 bg-slate-500 bg-opacity-60 z-50 flex items-center justify-center'>
			<div
				onClick={(e) => e.stopPropagation()}
				className={`mt-6 relative bg-lightest dark:bg-darkest w-10/12 sm:w-2/4 rounded p-6 flex flex-col max-h-[90%] min-w-[300px] ${className}`}>
				<div className='flex items-center justify-between sticky top-0 w-full text-fmd pr-2 pb-2'>
					<p>{title}</p>
					<button onClick={onClose} className='flex gap-1 items-center'>
						<Icon icon='iconoir:cancel' width='20' height='20' />
						<span>Close</span>
					</button>
				</div>
				{children}
			</div>
		</section>,
		document.body,
	);
};

export default Modal;
