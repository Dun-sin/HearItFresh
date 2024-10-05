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
			className='absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white group-hover:block hidden transition-all'
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
