'use client';

import { addTracksToPlayList, createPlayList } from '@/app/lib/spotify';
import { getAllTracks, getEveryAlbum } from '@/app/lib/utils';

import React from 'react';
import SubmitButtionContainer from '../SubmitButtonContainer';
import { useGeneralState } from '@/app/context/generalStateContext';
import { useInput } from '@/app/context/inputContext';
import { useLoading } from '@/app/context/loadingContext';

const SubmitButton = () => {
	const { setLoading, setLoadingMessage } = useLoading();
	const {
		buttonClick,
		setButtonClicked,
		setPlayListData,
		setErrorMessages,
		errorMessages,
	} = useGeneralState();
	const { artistArray, setArtistArray, artistName } = useInput();

	const combineSongs = async (artists: string[]) => {
		if (buttonClick === true) {
			setLoading(false);
			setLoadingMessage(null);
			return;
		}
		setButtonClicked(true);

		// calculate the max album to get based on the number of artists
		const maxAlbums = Math.floor(100 / (artists.length * 2));
		const maxTracksPerAlbum = Math.floor(100 / (artists.length * maxAlbums));

		setLoading(true);
		try {
			setLoadingMessage('Getting the albums of each artist');
			const albums: string[] = await getEveryAlbum(artists);

			setLoadingMessage('Getting All Tracks');

			const tracks = await getAllTracks(albums, maxTracksPerAlbum);

			setLoadingMessage('Creating The PlayList');
			const playlistInfo = await Promise.resolve(
				createPlayList(
					artists.slice(0, -1).join(', ') + ' and ' + artists.slice(-1),
					'old',
				),
			);

			if ('isError' in playlistInfo) {
				throw new Error(playlistInfo.err);
			}

			const { id, link, name } = playlistInfo;

			const playListID = id.substring('spotify:playlist:'.length);

			setLoadingMessage('Adding The Tracks To The Playlist');
			if (!tracks) throw new Error('Track is empty');
			addTracksToPlayList(tracks, playListID)
				.then((data) => setPlayListData({ link, name }))
				.catch((err) => {
					return err;
				});
			setArtistArray([]);
		} catch (err) {
			setErrorMessages({
				...errorMessages,
				error: 'Error Occured While Generating A Playlist, Try Again',
			});
			console.log(err);
		} finally {
			setLoading(false);
			setButtonClicked(false);
		}
	};

	const handleButton = () => {
		setLoading(true);

		const artist = artistName.current;
		if (!artist) return;

		const extratext = artist?.value.trim();
		const array = [...artistArray];
		if (extratext || extratext !== '') {
			array.push(extratext);
		}
		array && array.length > 1 && combineSongs(array);
	};
	return <SubmitButtionContainer handleSubmit={handleButton} />;
};

export default SubmitButton;
