'use client';

import React, { useState } from 'react';
import { useOptions } from '@/app/context/optionsContext';
import ArtistSearchInput from './ArtistSearchInput';

const Options = () => {
	const {
		setIsDifferentTypesOfArtists,
		setIsNotPopularArtists,
		selectedArtist,
		setSelectedArtist,
	} = useOptions();
	const [searchOpen, setSearchOpen] = useState(false);

	return (
		<div className={`flex flex-col gap-2`}>
			<h3 className={`text-fmd md:text-fsm text-gray`}>Options</h3>

			<div className='flex gap-4 items-center flex-wrap'>
				<div className={`flex items-center pl-4`}>
					<label
						htmlFor='nonPopular'
						className='cursor-pointer select-none text-sm flex items-center gap-2'>
						<input
							type='checkbox'
							name='nonPopular'
							onChange={(e) => setIsNotPopularArtists(e.target.checked)}
							className='form-checkbox w-4 h-4 text-brand rounded'
						/>

						<span>Get non-popular artists</span>
					</label>
				</div>
				<div className='flex items-center pl-4'>
					<label
						htmlFor='differentGenre'
						className='cursor-pointer select-none text-sm flex items-center gap-2'>
						<input
							type='checkbox'
							name='differentGenre'
							onChange={(e) => setIsDifferentTypesOfArtists(e.target.checked)}
							className='form-checkbox w-4 h-4 text-brand rounded'
						/>
						<span>Get a different genre</span>
					</label>
				</div>

				{selectedArtist ? (
					<div className='flex items-center pl-4'>
						<div className='flex items-center gap-2 rounded-full border border-gray border-opacity-50 bg-lightest pl-1.5 pr-1 py-1 shadow-sm'>
							{selectedArtist.image ? (
								<img
									src={selectedArtist.image}
									alt={selectedArtist.name}
									className='w-6 h-6 rounded-full object-cover shrink-0'
								/>
							) : (
								<span className='w-6 h-6 rounded-full bg-gray bg-opacity-30 shrink-0 flex items-center justify-center text-fxs text-gray'>
									{selectedArtist.name.charAt(0).toUpperCase()}
								</span>
							)}
							<span className='font-semibold text-fsm truncate text-darkest max-w-[140px]'>
								{selectedArtist.name}
							</span>
							<button
								type='button'
								aria-label='Remove selected artist'
								onClick={() => {
									setSelectedArtist(null);
									setSearchOpen(false);
								}}
								className='flex h-5 w-5 items-center justify-center rounded-full text-dark transition-colors hover:bg-red-500 hover:text-lightest shrink-0'>
								<svg
									aria-hidden='true'
									viewBox='0 0 24 24'
									fill='none'
									className='h-3 w-3'
									stroke='currentColor'
									strokeWidth='2.5'
									strokeLinecap='round'
									strokeLinejoin='round'>
									<path d='M18 6 6 18M6 6l12 12' />
								</svg>
							</button>
						</div>
					</div>
				) : (
					<div className='flex items-center pl-4'>
						<label
							htmlFor='specificArtist'
							className='cursor-pointer select-none text-sm flex items-center gap-2'>
							<input
								type='checkbox'
								name='specificArtist'
								checked={searchOpen}
								onChange={(e) => setSearchOpen(!!e.target.checked)}
								className='form-checkbox w-4 h-4 text-brand rounded'
							/>
							<span>Find songs from a specific artist</span>
						</label>
					</div>
				)}
			</div>

			{searchOpen && !selectedArtist && (
				<div className='pl-4'>
					<ArtistSearchInput />
				</div>
			)}
		</div>
	);
};

export default Options;
