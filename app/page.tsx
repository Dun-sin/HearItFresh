import AllDiscoverTracksContext from './components/AllContext';
import ArtistType from './components/DiscoverTracks/ArtistType';
import ChangeType from './components/DiscoverTracks/ChangeType';
import History from './components/History';
import Options from './components/DiscoverTracks/Options';
import PlaylistType from './components/DiscoverTracks/PlaylistType';
import ResultLink from './components/ResultLink';
import SubmitButtion from './components/DiscoverTracks/SubmitButtion';
import { TypeProvider } from './context/DiscoverTracks/typeContext';



const Page = () => {
	return (
		<AllDiscoverTracksContext>
			<TypeProvider>
				<section className='flex flex-col gap-5 max-w-[800px] w-full min-w-[300px] items-center justify-center px-5'>
					<div
						className={`sm:border-2 sm:border-brand rounded flex flex-col justify-center gap-6 sm:py-14 sm:px-10 items-center w-full relative`}>
						<ChangeType />

						<section className={`w-full flex flex-col items-center flex-grow`}>
							<span className={`flex flex-col gap-5 w-full`}>
								<div className={`w-full`}>
									<ArtistType />
									<PlaylistType />
								</div>
								<Options />

								<SubmitButtion />
							</span>
						</section>
						<ResultLink />
					</div>
					<History />
				</section>
						
			</TypeProvider>
		</AllDiscoverTracksContext>
	);
};

export default Page;
