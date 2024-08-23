import AllContext from '../components/AllContext';
import ArtistInput from '../components/TopTracks/ArtistInput';
import ConnectSpotify from '../components/ConnectSpotify';
import ResultLink from '../components/ResultLink';
import SubmitButton from '../components/TopTracks/SubmitButton';

const authUrl = `https://accounts.spotify.com/authorize?client_id=${
	process.env.SPOTIFY_CLIENT_ID
}&response_type=code&redirect_uri=${
	process.env.REDIRECT_URL as string
}&scope=playlist-modify-public%20playlist-read-private%20user-read-private`;

const CombineFavouriteArtistsSongs = () => {
	// useEffect(() => {
	//   if (inputUsed !== 'auto') return

	//   if (topArtists.length != 0) {
	//     artistButton.current.disabled = false
	//   }
	// }, [topArtists])

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

	return (
		<AllContext>
			<div className='sm:w-3/5 sm:border-2 sm:border-brand rounded flex flex-col justify-center gap-6 sm:py-14 sm:px-10 items-center max-w-[800px] w-full min-w-[300px] relative'>
				<section className='flex flex-col items-center gap-5 w-full'>
					{/* <button className="border-brand border-2 rounded text-fsm md:min-w-[40vw] md:max-w-[50%] min-w-[300px] h-10" onClick={handleGetTopArtist}>Use your top artists on Spotify</button> */}

					<ArtistInput />

					<SubmitButton />
				</section>
				<ResultLink />
				<ConnectSpotify authUrl={authUrl} />
			</div>
		</AllContext>
	);
};

export default CombineFavouriteArtistsSongs;
