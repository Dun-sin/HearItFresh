'use client';

import { KeyboardEvent, MouseEvent, useEffect } from 'react';

import { Icon } from '@iconify/react/dist/iconify.js';
import { useGeneralState } from '@/app/context/generalStateContext';
import { useInput } from '@/app/context/inputContext';
import { useLoading } from '@/app/context/loadingContext';
import { useType } from '@/app/context/DiscoverTracks/typeContext';

const ArtistType = () => {
	const { type } = useType();
	const { loading } = useLoading();
	const { errorMessages } = useGeneralState();
	const { artistName, artistArray, setArtistArray } = useInput();

	const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === ',') {
			e.preventDefault();

			const artist = artistName.current;
			if (!artist) return;

			if (artist?.value.trim() !== '') {
				setArtistArray([...artistArray, artist.value.trim()]);
				artistName.current.value = '';
			}
		}
	};

	const handleArtistDelete = (e: MouseEvent, index: number) => {
		const artists = [...artistArray];
		artists.splice(index, 1);

		setArtistArray(artists);
	};

	useEffect(() => {
		if (type === 'artist' && artistName && artistName.current) {
			artistName.current.disabled = loading;
		}
	}, [loading, type, artistName]);

	return (
		type === 'artist' && (
			<>
				<label htmlFor='artistName' className={`flex flex-col w-full`}>
					<span className={`w-full`}>
						<h2 className={`text-fmd md:text-fsm`}>
							Enter the name of an artist you love
						</h2>
						<h3 className={'dark:text-gray text-dark text-fsm md:text-fxs'}>
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
								className={`mt-2 flex items-center gap-2 max-w-[500px] flex-wrap`}>
								{artistArray.map((value, index) => (
									<button
										key={value}
										className={`bg-brand px-2 py-1 flex gap-2 w-fit items-center justify-center cursor-pointer rounded`}
										onClick={(e) => handleArtistDelete(e, index)}>
										<span className={`text-lightest text-fsm md:text-fxs`}>
											{value}
										</span>
										<Icon
											icon='iconoir:cancel'
											className='text-lightest w-4 h-4'
										/>
									</button>
								))}
							</span>
						)}
					</span>
				</label>
				{errorMessages.notCorrectFormatForArtist === true && (
					<p className='text-fsm text-red-500'>
						Seems like you entered gave a single artist
					</p>
				)}
			</>
		)
	);
};

export default ArtistType;
