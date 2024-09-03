'use client';

import React from 'react';
import { useType } from '@/app/context/DiscoverTracks/typeContext';

const ChangeType = () => {
	const { type, setType } = useType();

	return (
		<div
			className={`w-5/12 max-w-[400px] min-w-[150px] flex items-center rounded p-1 dark:bg-lightest border-2 border-brand dark:border-0`}>
			<button
				onClick={() => setType('artist')}
				className={`${
					type === 'artist' ? 'bg-brand text-lightest' : 'text-darkest'
				} w-1/2 text-center text-fsm py-1 rounded-l cursor-pointer`}>
				Artist
			</button>
			<button
				onClick={() => setType('playlist')}
				className={`${
					type === 'playlist' ? 'bg-brand text-lightest' : 'text-darkest'
				} w-1/2 text-center text-fsm py-1 rounded-r cursor-pointer`}>
				Playlist
			</button>
		</div>
	);
};

export default ChangeType;
