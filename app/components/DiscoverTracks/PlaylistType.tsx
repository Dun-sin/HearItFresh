'use client';

import React, { useEffect } from 'react';

import { useGeneralState } from '@/app/context/generalStateContext';
import { useInput } from '@/app/context/inputContext';
import { useLoading } from '@/app/context/loadingContext';
import { useType } from '@/app/context/DiscoverTracks/typeContext';

const PlaylistType = () => {
	const { loading } = useLoading();
	const { type, setType } = useType();
	const { errorMessages } = useGeneralState();
	const { spotifyPlaylist } = useInput();

	useEffect(() => {
		if (type === 'playlist' && spotifyPlaylist && spotifyPlaylist.current) {
			spotifyPlaylist.current.disabled = loading;
		}
	}, [loading, type, spotifyPlaylist]);
	return (
		type === 'playlist' && (
			<>
				<label htmlFor='spotifyPlaylist' className={`flex flex-col w-full`}>
					<span className={`w-full`}>
						<h2 className={`text-fmd md:text-fsm`}>
							Enter a Spotify Playlist Link
						</h2>
						<h3 className='dark:text-gray text-dark text-fsm md:text-fxs'>
							e.g https://open.spotify.com/playlist/1B2CSnhZXXVC6xQcY3R4Fk
						</h3>
						<input
							type='text'
							name='spotifyPlaylist'
							className='h-8 rounded p-2 outline-none border-2 focus:border-brand w-full text-darkest'
							ref={spotifyPlaylist}
							aria-label='spotifyPlaylist'
						/>
					</span>
				</label>
				{errorMessages.notCorrectSpotifyLink === true && (
					<p className='text-fsm text-red-500'>Not a correct spotify link</p>
				)}
			</>
		)
	);
};

export default PlaylistType;
