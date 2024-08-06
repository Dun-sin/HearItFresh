'use client';

import { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import {
	addTracksToPlayList,
	createPlayList,
	getAllTracksInAPlaylist,
} from './lib/spotify';
import {
	extractPlaylistId,
	getAllTracks,
	getEveryAlbum,
	isValidPlaylistLink,
} from './lib/utils';

import ConnectSpotify from './components/ConnectSpotify';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Icon } from '@iconify/react';
import Loading from './components/Loading';
import OpenOnSpotify from './components/OpenOnSpotify';
import { useAuth } from './context/authContext';

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY as string);

const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
const page = () => {
	const [playListData, setPlayListData] = useState({
		link: '',
		name: '',
	});

	const [type, setType] = useState('artist');
	const [artistArray, setArtistArray] = useState<string[]>([]);

	const [buttonClick, setButtonClicked] = useState(false);
	const [loading, setLoading] = useState<boolean>(false);
	const [loadingMessage, setLoadingMessage] = useState<null | string>(null);
	const [errorMessages, setErrorMessages] = useState<{
		notCorrectSpotifyLink: boolean;
		notCorrectFormatForArtist: boolean;
		error: null | any;
	}>({
		notCorrectSpotifyLink: false,
		notCorrectFormatForArtist: false,
		error: null,
	});
	const [isDifferentTypesOfArtists, setIsDifferentTypesOfArtists] =
		useState(false);
	const [isNotPopularArtists, setIsNotPopularArtists] = useState(false);

	const spotifyPlaylist = useRef<HTMLInputElement>(null);
	const artistName = useRef<HTMLInputElement>(null);

	const { isLoggedIn } = useAuth();

	useEffect(() => {
		if (type === 'playlist' && spotifyPlaylist && spotifyPlaylist.current) {
			spotifyPlaylist.current.disabled = loading;
		} else if (type === 'artist' && artistName && artistName.current) {
			artistName.current.disabled = loading;
		}
	}, [loading]);

	const getSimilarArtists = async (artists: string[]) => {
		if (buttonClick === true) {
			return;
		}
		setButtonClicked(true);

		setLoading(true);
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
			``;
			const response = await result.response;
			const text = response.text();

			const artistList = text.replace(/:\n/g, '').trimStart().split(':');

			const lastPart = artistList.length > 0 ? artistList.at(-1) : undefined;

			const finalList = lastPart ? lastPart.split(', ') : [];

			finalList.length > 20 ? (finalList.length = 20) : null;

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
				.then(() => setPlayListData({ link, name }))
				.catch((err) => {
					return err;
				});

			setLoadingMessage('Done');
			setArtistArray([]);
		} catch (err) {
			setErrorMessages({
				...errorMessages,
				error: 'Error occured while generating a playlist. Try to login again',
			});
			return err;
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

		setErrorMessages((prevState) => ({
			...prevState,
			notCorrectSpotifyLink: false,
		}));

		try {
			setLoadingMessage(`Extracting Playlist Link`);
			const playlistId = extractPlaylistId(link);

			setLoadingMessage(`Getting All Tracks In The Playlist`);
			const playlistTracks = await getAllTracksInAPlaylist(playlistId);

			setLoadingMessage(`Getting all Artist's In The Playlist`);
			const trackArtists = playlistTracks
				.flat()
				.map((item) => item.track.artists.slice(0, 2));
			const artistNames = trackArtists.flat().map((item) => item.name);
			const uniqueArtistNames = [...new Set(artistNames)];

			getSimilarArtists(uniqueArtistNames);
		} catch (err) {
			setLoading(false);
			setErrorMessages((prevState) => ({
				...prevState,
				error: 'Error occured while generating a playlist. Try to login again',
			}));
		}
	}

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

	const handleSubmit = () => {
		if (type === 'artist') {
			const artist = artistName.current;
			if (!artist) return;

			const extratext = artist?.value.trim();
			const array = [...artistArray];
			if (extratext || extratext !== '') {
				array.push(extratext);
			} else {
				array && array.length > 1 && getSimilarArtists(array);
			}
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

	const handleArtistDelete = (e: MouseEvent, index: number) => {
		const artists = [...artistArray];
		artists.splice(index, 1);

		setArtistArray(artists);
	};

	return (
		<div
			className={`w-3/5 border-2 border-brand rounded flex flex-col justify-center gap-6 py-14 px-10 items-center max-w-[800px] min-w-[300px] relative`}>
			<div
				className={`w-5/12 max-w-[400px] flex items-center rounded p-1 bg-lightest`}>
				<p
					onClick={() => setType('artist')}
					className={`${
						type === 'artist' ? 'bg-brand text-lightest' : 'text-darkest'
					} w-1/2 text-center text-fsm py-1 rounded-l cursor-pointer`}>
					Artist
				</p>
				<p
					onClick={() => setType('playlist')}
					className={`${
						type === 'playlist' ? 'bg-brand text-lightest' : 'text-darkest'
					} w-1/2 text-center text-fsm py-1 rounded-r cursor-pointer`}>
					Playlist
				</p>
			</div>
			<div className={`w-full flex flex-col items-center max-w-[600px]`}>
				<span className={`flex flex-col gap-5 w-full`}>
					<div className={`w-full`}>
						{type === 'artist' && (
							<>
								<label htmlFor='artistName' className={`flex flex-col w-full`}>
									<span className={`w-full`}>
										<h2 className={`text-fmd md:text-fsm`}>
											Enter the name of an artist you love
										</h2>
										<h3
											className={
												'dark:text-gray text-dark text-fsm md:text-fxs'
											}>
											Add artist name, and type a ',' at the end to include them
											in the list.
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
													<div
														key={index}
														className={`bg-brand px-2 py-1 flex gap-2 w-fit items-center justify-center cursor-pointer rounded`}
														onClick={(e) => handleArtistDelete(e, index)}>
														<span
															className={`text-lightest text-fsm md:text-fxs`}>
															{value}
														</span>
														<Icon
															icon='iconoir:cancel'
															className='text-lightest w-4 h-4'
														/>
													</div>
												))}
											</span>
										)}
									</span>
								</label>
								{errorMessages.notCorrectFormatForArtist === true && (
									<p className='text-fsm text-red-500'>
										Seems like you either just gave a single artist
									</p>
								)}
							</>
						)}
						{type === 'playlist' && (
							<>
								<label
									htmlFor='spotifyPlaylist'
									className={`flex flex-col w-full`}>
									<span className={`w-full`}>
										<h2 className={`text-fmd md:text-fsm`}>
											Enter a Spotify Playlist Link
										</h2>
										<h3 className='dark:text-gray text-dark text-fsm md:text-fxs'>
											e.g
											https://open.spotify.com/playlist/1B2CSnhZXXVC6xQcY3R4Fk
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
									<p className='text-fsm text-red-500'>
										Not a correct spotify link
									</p>
								)}
							</>
						)}
					</div>
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
									onChange={(e) =>
										setIsDifferentTypesOfArtists(!!e.target.value)
									}
									className='form-checkbox w-4 h-4 text-brand rounded'
								/>
								<span>Get a different genre</span>
							</label>
						</div>
					</div>

					{loading ? (
						<Loading loadingMessage={loadingMessage as string} />
					) : (
						!buttonClick && (
							<button
								className={`bg-brand text-lightest rounded p-3`}
								onClick={handleSubmit}>
								Generate Playlist
							</button>
						)
					)}
				</span>
			</div>
			{!loading && (
				<section className='w-full max-w-[600px]'>
					{playListData.link.length !== 0 && playListData.name.length !== 0 ? (
						<>
							<OpenOnSpotify link={playListData.link} />
						</>
					) : (
						<p className='text-fxs text-red-500'>
							{buttonClick &&
								errorMessages.error !== null &&
								errorMessages.error}
						</p>
					)}
				</section>
			)}
			{!isLoggedIn && <ConnectSpotify />}
		</div>
	);
};

export default page;
