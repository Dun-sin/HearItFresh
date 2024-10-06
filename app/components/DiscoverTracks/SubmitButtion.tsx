'use client';

import {
	addToUrl,
	extractPlaylistId,
	getAllTracks,
	getEveryAlbum,
	isValidPlaylistLink,
} from '@/app/lib/utils';
import {
	addTracksToPlayList,
	createPlayList,
	getAllTracksInAPlaylist,
} from '@/app/lib/spotify';

import { GoogleGenerativeAI } from '@google/generative-ai';
import React from 'react';
import SubmitButtionContainer from '../SubmitButtonContainer';
import { addUserHistory } from '@/app/lib/db';
import { useAuth } from '@/app/context/authContext';
import { useGeneralState } from '@/app/context/generalStateContext';
import { useHistory } from '@/app/context/HistoryContext';
import { useInput } from '@/app/context/inputContext';
import { useLoading } from '@/app/context/loadingContext';
import { useOptions } from '@/app/context/optionsContext';
import { useType } from '@/app/context/DiscoverTracks/typeContext';
import { toast } from 'react-toastify';

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY as string);

const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const SubmitButtion = () => {
	const { setLoading } = useLoading();
	const { type } = useType();
	const {
		setErrorMessages,
		errorMessages,
		buttonClick,
		setButtonClicked,
		setPlayListData,
	} = useGeneralState();
	const { user, logOut } = useAuth();
	const { setLoadingMessage } = useLoading();
	const { artistName, artistArray, spotifyPlaylist, setArtistArray } =
		useInput();
	const { setHistory } = useHistory();
	const { isNotPopularArtists, isDifferentTypesOfArtists } = useOptions();

	const getSimilarArtists = async (artists: string[]) => {
		if (buttonClick === true) {
			setLoading(false);
			return;
		}
		setButtonClicked(true);

		try {
			const type = isDifferentTypesOfArtists
				? 'completely different from'
				: 'similar to';
			const popularity = isNotPopularArtists ? 'not popular' : 'popular';
			const prompt = `Give me 20 musicians who are ${popularity} and ${type} the following artists provided: ${artists.join(
				', ',
			)}. Be sure none of the musicians listed overlap with those provided and that the result is not in list form and not more than 20 musicians. The results should also be separated by a comma.`;

			// const newPrompt = `Please analyze the following list of musicians: '${artists.join(', ')}', and identify the sub-genre that is associated with 70 - 90% of them. Based on this analysis, please provide a list of 20 musicians who are ${popularity} and are ${type} as the sub-genres. Please ensure that the resulting list does not include any of the musicians from the original list provided. To help narrow down the results, please only provide the list of recommended musicians separated by commas.`

			setLoadingMessage(`Getting the list of new artists`);
			const result = await model.generateContent(prompt);

			const response = await result.response;
			const text = response.text();

			const artistList = text.replace(/:\n/g, '').trimStart().split(':');

			const lastPart = artistList.length > 0 ? artistList.at(-1) : undefined;

			const finalList = lastPart ? lastPart.split(', ') : [];

			finalList.length > 20 && (finalList.length = 20);

			setLoadingMessage(`Getting the albums of each artist`);
			const albums = await getEveryAlbum(finalList);

			setLoadingMessage('Getting All Tracks');
			const tracks = await getAllTracks(albums as string[], 1);

			setLoadingMessage('Creating The PlayList');
			const playlistInfo = await Promise.resolve(
				createPlayList(
					finalList.slice(0, -1).join(', ') + ' and ' + finalList.slice(-1),
					'new',
				),
			);

			if ('isError' in playlistInfo) {
				throw new Error(playlistInfo.err);
			}
			const { id, link, name } = playlistInfo;
			const playListID = id.substring('spotify:playlist:'.length);

			setLoadingMessage('Adding The Tracks To The Playlist');

			if (tracks === null) throw new Error('Track is empty');
			addTracksToPlayList(tracks, playListID)
				.then(() => {
					addToUrl('link', link.split('/').at(-1) as string);
					setPlayListData({ link, name });
				})
				.catch((err) => {
					return err;
				});

			setLoadingMessage('Done');
			setArtistArray([]);
			toast.success('Playlist Created');
		} catch (err) {
			setErrorMessages({
				...errorMessages,
				error: 'Error occured while generating a playlist. Try to login again',
			});
			console.log(err);
		} finally {
			setLoading(false);
			setButtonClicked(false);
			setLoadingMessage(null);
		}
	};

	async function handleIfItsAPlaylistLink(link: string) {
		if (!isValidPlaylistLink(link)) {
			setErrorMessages({ ...errorMessages, notCorrectSpotifyLink: true });
			setLoading(false);
			return;
		}

		setErrorMessages({ ...errorMessages, notCorrectSpotifyLink: false });

		try {
			setLoadingMessage(`Extracting Playlist Link`);
			const playlistId = extractPlaylistId(link);

			await addHistoryToDB(playlistId);

			setLoadingMessage(`Getting All Tracks In The Playlist`);
			const playlistTracks = await getAllTracksInAPlaylist(playlistId);

			setLoadingMessage(`Getting all Artist's In The Playlist`);
			const trackArtists = playlistTracks
				.flat()
				.map((item: any) => item.track.artists.slice(0, 2));
			const artistNames: string[] = trackArtists
				.flat()
				.map((item: any) => item.name);
			const uniqueArtistNames = [...new Set(artistNames)];

			getSimilarArtists(uniqueArtistNames);
		} catch (err) {
			setLoading(false);
			setErrorMessages({
				...errorMessages,
				error: 'Error occured while generating a playlist. Try to login again',
			});
			console.log(err);
		}
	}

	const handleSubmit = async () => {
		if (type === 'artist') {
			setLoading(true);
			const artist = artistName.current;
			if (!artist) return;

			const extratext = artist?.value.trim();
			const array = [...artistArray];

			if (extratext || extratext !== '') {
				array.push(extratext);
			}

			await addHistoryToDB(array.join(', '));

			array && array.length > 1 && getSimilarArtists(array);
		} else if (type === 'playlist') {
			setLoading(true);
			if (!spotifyPlaylist.current) {
				setLoading(false);
				return;
			}
			const link = spotifyPlaylist.current.value;
			handleIfItsAPlaylistLink(link);
		}
	};

	const addHistoryToDB = async (text: string) => {
		if (!user) {
			logOut();
			return { message: 'error', history: [] };
		}

		const userId = user.user_id;
		const { message, history } = await addUserHistory(userId, text);

		const newHistory = history.map(
			({ text, lastUsed }: { text: string; lastUsed: string }) => ({
				text,
				lastUsed: new Date(lastUsed),
			}),
		);
		if (message === 'success') setHistory(newHistory);
	};
	return <SubmitButtionContainer handleSubmit={handleSubmit} />;
};

export default SubmitButtion;
