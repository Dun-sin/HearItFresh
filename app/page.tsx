import AllDiscoverTracksContext from './components/AllContext';
import ArtistType from './components/DiscoverTracks/ArtistType';
import ChangeType from './components/DiscoverTracks/ChangeType';
import ConnectSpotify from './components/ConnectSpotify';
import Options from './components/DiscoverTracks/Options';
import PlaylistType from './components/DiscoverTracks/PlaylistType';
import ResultLink from './components/ResultLink';
import SubmitButtion from './components/DiscoverTracks/SubmitButtion';
import { TypeProvider } from './context/DiscoverTracks/typeContext';

const authUrl = `https://accounts.spotify.com/authorize?client_id=${
	process.env.SPOTIFY_CLIENT_ID
}&response_type=code&redirect_uri=${
	process.env.REDIRECT_URL as string
}&scope=playlist-modify-public%20playlist-read-private%20user-read-private`;

const Page = () => {
	return (
		<AllDiscoverTracksContext>
			<TypeProvider>
				<div
					className={`sm:w-3/5 sm:border-2 sm:border-brand rounded flex flex-col justify-center gap-6 sm:py-14 sm:px-10 items-center max-w-[800px] w-4/5 min-w-[300px] relative`}>
					<ChangeType />
					<div className={`w-full flex flex-col items-center max-w-[600px]`}>
						<span className={`flex flex-col gap-5 w-full`}>
							<div className={`w-full`}>
								<ArtistType />
								<PlaylistType />
							</div>
							<Options />

							<SubmitButtion />
						</span>
					</div>
					<ResultLink />
					<ConnectSpotify authUrl={authUrl} />
				</div>
			</TypeProvider>
		</AllDiscoverTracksContext>
	);
};

export default Page;
