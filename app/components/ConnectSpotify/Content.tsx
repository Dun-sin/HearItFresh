import { Suspense } from 'react';
import Loading from '../Loading';
import ConnectSpotify from '.';

const authUrl = `https://accounts.spotify.com/authorize?client_id=${
	process.env.SPOTIFY_CLIENT_ID
}&response_type=code&redirect_uri=${
	process.env.REDIRECT_URL as string
}&scope=playlist-modify-public%20playlist-read-private%20user-read-private`;

const Content = () => {
	return (
		<Suspense fallback={<Loading loadingMessage='Please Wait...' />}>
			<ConnectSpotify authUrl={authUrl} />
		</Suspense>
	);
};

export default Content;
