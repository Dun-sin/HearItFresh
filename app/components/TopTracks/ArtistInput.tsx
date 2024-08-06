'use client';

import React, { KeyboardEvent, MouseEvent } from 'react';

import { Icon } from '@iconify/react/dist/iconify.js';
import { useInput } from '@/app/context/inputContext';

const ArtistInput = () => {
	const { artistArray, artistName, setArtistArray } = useInput();

	const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === ',') {
			e.preventDefault();

			if (!artistName.current) return;
			if (artistName.current.value.trim() !== '') {
				setArtistArray([...artistArray, artistName.current.value.trim()]);
				artistName.current.value = '';
			}
		}
	};

	const handleArtistDelete = (e: MouseEvent, index: number) => {
		const artists = [...artistArray];
		artists.splice(index, 1);

		setArtistArray(artists);
	};

	return (
		<label
			htmlFor='artistName'
			className={`flex flex-col w-full max-w-[600px]`}>
			<span className={`w-full`}>
				<h2 className={`text-fmd md:text-fsm`}>
					Enter the name of an artist you love
				</h2>
				<h3 className='dark:text-gray text-dark text-fsm md:text-fxs'>
					Add artist name, and type a ',' at the end to include them in the
					list.
				</h3>
				<input
					type='text'
					name='artistName'
					className='h-8 rounded p-2 outline-none border-2 focus:border-brand w-full text-darkest'
					ref={artistName}
					onKeyDown={handleKeyPress}
					aria-label='artistName'
					autoComplete='off'
				/>
				{artistArray.length !== 0 && (
					<span
						className={`mt-2 flex items-center gap-2 max-w-[600px] flex-wrap`}>
						{artistArray.map((value, index) => (
							<div
								key={index}
								className={`bg-brand px-2 py-1 flex gap-2 w-fit items-center justify-center cursor-pointer rounded`}
								onClick={(e) => handleArtistDelete(e, index)}>
								<span className={`text-lightest text-fsm md:text-fxs`}>
									{value}
								</span>
								<Icon icon='iconoir:cancel' className='text-lightest w-4 h-4' />
							</div>
						))}
					</span>
				)}
			</span>
		</label>
	);
};

export default ArtistInput;
