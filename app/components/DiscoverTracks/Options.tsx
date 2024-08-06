'use client';

import React from 'react';
import { useOptions } from '@/app/context/optionsContext';

const Options = () => {
	const { setIsDifferentTypesOfArtists, setIsNotPopularArtists } = useOptions();
	return (
		<div className={`flex flex-col gap-2`}>
			<h3 className={`text-fmd md:text-fsm text-gray`}>Options</h3>

			<div className={`flex items-center pl-4`}>
				<label
					htmlFor='nonPopular'
					className='cursor-pointer select-none text-sm font-medium flex items-center gap-2'>
					<input
						type='checkbox'
						name='nonPopular'
						onChange={(e) => setIsNotPopularArtists(!!e.target.value)}
						className='form-checkbox w-4 h-4 text-brand rounded'
					/>

					<span>Get non-popular artists</span>
				</label>
			</div>
			<div className='flex items-center pl-4'>
				<label
					htmlFor='differentGenre'
					className='cursor-pointer select-none text-sm font-medium flex items-center gap-2'>
					<input
						type='checkbox'
						name='differentGenre'
						onChange={(e) => setIsDifferentTypesOfArtists(!!e.target.value)}
						className='form-checkbox w-4 h-4 text-brand rounded'
					/>
					<span>Get a different genre</span>
				</label>
			</div>
		</div>
	);
};

export default Options;
