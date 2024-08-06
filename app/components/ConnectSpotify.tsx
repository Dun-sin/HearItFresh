import { useAuth } from '../context/authContext';

const authUrl = `https://accounts.spotify.com/authorize?client_id=${
	process.env.SPOTIFY_CLIENT_ID
}&response_type=code&redirect_uri=${
	process.env.REDIRECT_URL as string
}&scope=playlist-modify-public%20playlist-read-private%20user-read-private`;

const ConnectSpotify = () => {
	const { isAuthInProgress } = useAuth();
	return (
		<div className='absolute w-full h-full flex items-center justify-center bg-gray bg-opacity-80 flex-col'>
			<p className={`text-flg md:text-fmd font-bold`}>
				{isAuthInProgress
					? 'Connecting your spotify'
					: 'Please login to connect your spotify and use this tool'}
			</p>
			{!isAuthInProgress && (
				<a
					href={authUrl}
					className='px-4 py-2 bg-brand rounded-md text-lightest'>
					Connect Your Spotify
				</a>
			)}
		</div>
	);
};

export default ConnectSpotify;
