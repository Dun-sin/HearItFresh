'use client';

import React, { useEffect } from 'react';

import { useGeneralState } from '@/app/context/generalStateContext';
import { useInput } from '@/app/context/inputContext';
import { useLoading } from '@/app/context/loadingContext';
import { useSeedSongs } from '@/app/context/seedSongsContext';

const PlaylistInput = () => {
	const { loading } = useLoading();
	const { errorMessages } = useGeneralState();
	const { spotifyPlaylist } = useInput();

	const { extractedSongs, selectedSeedIds, toggleSeed, clearSeeds, selectAllSeeds } =
		useSeedSongs();

	useEffect(() => {
		if (spotifyPlaylist && spotifyPlaylist.current) {
			spotifyPlaylist.current.disabled = loading;
		}
	}, [loading, spotifyPlaylist]);

	return (
		<div className='flex flex-col w-full gap-4'>
			<label htmlFor='spotifyPlaylist' className={`flex flex-col w-full`}>
				<span className={`w-full`}>
					<span className={`w-full flex items-center gap-2`}>
						<h2 className={`text-fmd md:text-fsm`}>
							Enter a Spotify or YouTube Music Playlist Link
						</h2>
						<span
							className='relative flex items-center group cursor-help'
							aria-label='Upload a playlist to select songs for lyrics matching'>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								viewBox='0 0 20 20'
								fill='currentColor'
								className='w-4 h-4 text-gray dark:text-gray hover:text-brand transition-colors'>
								<path
									fillRule='evenodd'
									d='M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a1 1 0 0 0 0 2v3a1 1 0 0 0 1 1h1a1 1 0 1 0 0-2v-3a1 1 0 0 0-1-1H9Z'
									clipRule='evenodd'
								/>
							</svg>
							<span className='pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-[220px] rounded bg-darkest text-lightest text-fxs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10'>
								Upload a playlist to select songs for lyrics matching
							</span>
						</span>
					</span>
					<h3 className='dark:text-gray text-dark text-fsm md:text-fxs'>
						e.g https://open.spotify.com/playlist/3d4.. or
						https://music.youtube.com/playlist?list=34..
					</h3>
					<input
						type='text'
						name='spotifyPlaylist'
						className='h-8 rounded p-2 outline-none border-2 focus:border-brand w-full text-darkest'
						ref={spotifyPlaylist}
						aria-label='playlistLink'
					/>
				</span>
			</label>
			{errorMessages.notCorrectSpotifyLink === true && (
				<p className='text-fsm text-red-500'>
					Not a correct Spotify or YouTube Music playlist link
				</p>
			)}

			{extractedSongs.length > 0 && (
				<div className='flex flex-col gap-2 w-full animate-fade-in'>
					<h3 className='text-fmd font-bold'>Select Seed Songs (5-10)</h3>
					<p className='text-fsm text-gray dark:text-gray'>
						{selectedSeedIds.size} selected. We use these to find lyrically
						similar songs.
					</p>
					<div className='flex justify-between items-center mb-2 mt-2'>
						<div className='flex gap-4'>
							<button
								onClick={selectAllSeeds}
								className='text-brand text-fsm hover:underline font-bold'
								type='button'>
								Select 10
							</button>
							<button
								onClick={clearSeeds}
								className='text-brand text-fsm hover:underline font-bold'
								type='button'>
								Clear selection
							</button>
						</div>
						<div className='text-brand text-fsm font-bold'>
							Selected: {selectedSeedIds.size}/10
						</div>
					</div>
					<div className='grid grid-cols-2 gap-2 overflow-y-auto max-h-80 p-1 custom-scrollbar'>
						{extractedSongs.map((song) => (
							<div
								key={song.id}
								onClick={() => toggleSeed(song.id)}
								className={`cursor-pointer rounded p-2 flex flex-col items-center text-center gap-1 border-2 transition-all select-none ${
									selectedSeedIds.has(song.id)
										? 'border-brand bg-brand dark:bg-opacity-20 bg-opacity-10'
										: 'border-gray dark:border-opacity-30 border-opacity-30 hover:border-brand hover:border-opacity-50'
								}`}>
								{song.image && (
									<img
										src={song.image}
										alt={song.name}
										className='w-16 h-16 object-cover rounded shadow'
									/>
								)}
								<span className='text-fxs font-bold break-all line-clamp-2 w-full mt-1'>
									{song.name}
								</span>
								<span className='text-fxs text-gray line-clamp-1 w-full'>
									{song.artist.join(', ')}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default PlaylistInput;
