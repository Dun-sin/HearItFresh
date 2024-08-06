'use client';

import { KeyboardEvent, MouseEvent, useRef, useState } from 'react';
import { addTracksToPlayList, createPlayList } from '../lib/spotify';
import { getAllTracks, getEveryAlbum } from '../lib/utils';

import ConnectSpotify from '../components/ConnectSpotify';
import { Icon } from '@iconify/react';
import Loading from '../components/Loading';
import OpenOnSpotify from '../components/OpenOnSpotify';
import { useAuth } from '../context/authContext';
import { useTheme } from '../context/themeContext';

const CombineFavouriteArtistsSongs = () => {
	const [isLoading, setIsLoading] = useState<{
		state: boolean;
		message: null | string;
	}>({
		state: false,
		message: null,
	});
	const [playListData, setPlayListData] = useState({
		link: '',
		name: '',
	});
	// const [topArtists, setTopArtists] = useState([])
	const [buttonClick, setButtonClicked] = useState(false);
	const [errorMessages, setErrorMessages] = useState<{
		notCorrectFormatForArtist: boolean;
		error: null | string;
	}>({
		notCorrectFormatForArtist: false,
		error: null,
	});
	const [artistArray, setArtistArray] = useState<string[]>([]);
	// const [inputUsed, setInputUsed] = useState('manual')
	// const artistButton = useRef(null)

	const artistName = useRef<HTMLInputElement>(null);

	const { isLoggedIn } = useAuth();

	// useEffect(() => {
	//   if (inputUsed !== 'auto') return

	//   if (topArtists.length != 0) {
	//     artistButton.current.disabled = false
	//   }
	// }, [topArtists])

	const combineSongs = async (artists: string[]) => {
		if (buttonClick === true) {
			setIsLoading({ state: false, message: null });
			return;
		}
		setButtonClicked(true);

		// calculate the max album to get based on the number of artists
		const maxAlbums = Math.floor(100 / (artists.length * 2));
		const maxTracksPerAlbum = Math.floor(100 / (artists.length * maxAlbums));

		try {
			setIsLoading({
				state: true,
				message: 'Getting the albums of each artist',
			});
			const albums = await getEveryAlbum(artists);

			setIsLoading((prevState) => ({
				...prevState,
				message: 'Getting All Tracks',
			}));
			const tracks = await getAllTracks(albums as string[], maxTracksPerAlbum);

			setIsLoading((prevState) => ({
				...prevState,
				message: 'Creating The PlayList',
			}));
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

			setIsLoading((prevState) => ({
				...prevState,
				message: 'Adding The Tracks To The Playlist',
			}));
			if (!tracks) throw new Error('Track is empty');
			addTracksToPlayList(tracks, playListID)
				.then((data) => setPlayListData({ link, name }))
				.catch((err) => {
					return err;
				});
			setArtistArray([]);
		} catch (err) {
			setErrorMessages((prevState) => ({
				...prevState,
				error: 'Error Occured While Generating A Playlist, Try To Login Again',
			}));
			return err;
		} finally {
			setIsLoading({ state: false, message: null });
			setButtonClicked(false);
		}
	};

	const handleButton = () => {
		setIsLoading((prevState) => ({ ...prevState, state: true }));
		artistArray && artistArray.length > 1 && combineSongs(artistArray);
	};

	// const handleGetTopArtist = async () => {
	//   setInputUsed('auto')
	//   artistName.current.value = ''
	//   artistName.current.disabled = true
	//   artistButton.current.disabled = true

	//   try {
	//     const data = await getUserTopArtists()
	//     setTopArtists(data)
	//   } catch (err) {
	//     setErrorMessages((prevState) => ({ ...prevState, error: 'Error Occured While Getting Your Top Artists, Try To Login Again' }));
	//   }
	// }

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
		<div className='w-3/5 border-2 border-brand rounded flex flex-col justify-center gap-6 py-14 px-10 items-center max-w-[800px] min-w-[300px] relative'>
			<section className='flex flex-col items-center gap-5'>
				{/* <button className="border-brand border-2 rounded text-fsm md:min-w-[40vw] md:max-w-[50%] min-w-[300px] h-10" onClick={handleGetTopArtist}>Use your top artists on Spotify</button> */}

				<label htmlFor='artistName' className={`flex flex-col w-full`}>
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
								className={`mt-2 flex items-center gap-2 max-w-[500px] flex-wrap`}>
								{artistArray.map((value, index) => (
									<div
										key={index}
										className={`bg-brand px-2 py-1 flex gap-2 w-fit items-center justify-center cursor-pointer rounded`}
										onClick={(e) => handleArtistDelete(e, index)}>
										<span className={`text-lightest text-fsm md:text-fxs`}>
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
				{isLoading.state ? (
					<Loading loadingMessage={isLoading.message as string} />
				) : (
					!buttonClick && (
						<button
							className={`bg-brand text-lightest rounded p-3`}
							onClick={handleButton}>
							Generate Playlist
						</button>
					)
				)}
			</section>
			{!isLoading.state && (
				<section className='w-full max-w-[600px]'>
					{playListData.link.length !== 0 && playListData.name.length !== 0 ? (
						<OpenOnSpotify link={playListData.link} />
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

export default CombineFavouriteArtistsSongs;
