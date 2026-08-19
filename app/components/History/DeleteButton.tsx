'use client';

import { Icon } from '@iconify/react/dist/iconify.js';
import { removeUserHistory } from '@/app/lib/db';
import { toast } from 'react-toastify';
import { useHistory } from '@/app/context/HistoryContext';
import { useTransition } from 'react';

type DeleteButtonType = {
	id: string;
	text: string;
};

const DeleteButton = ({ id, text }: DeleteButtonType) => {
	const { removeHistoryItem } = useHistory();
	const [isPending, startTransition] = useTransition();

	const handleClick = () => {
		startTransition(async () => {
			const response = await removeUserHistory(id, text);
			if (response === 'success') {
				toast.success('Deleted Successfully');
				removeHistoryItem(text);
			} else if (response === 'error') {
				toast.error(`Couldn't Delete History`);
			}
		});
	};

	return (
		<button
			className='absolute right-4 top-4 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100'
			onClick={handleClick}
			disabled={isPending}>
			<Icon
				icon={isPending ? 'mdi:loading' : 'mdi:delete'}
				width='18'
				height='18'
				className={isPending ? 'animate-spin' : ''}
			/>
		</button>
	);
};

export default DeleteButton;
