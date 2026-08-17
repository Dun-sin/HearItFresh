import AllDiscoverTracksContext from './components/AllContext';
import History from './components/History';
import Options from './components/DiscoverTracks/Options';
import PlaylistInput from './components/DiscoverTracks/PlaylistInput';
import ResultLink from './components/ResultLink';
import SubmitButtion from './components/DiscoverTracks/SubmitButtion';



const Page = () => {
	return (
		<AllDiscoverTracksContext>
			<section className='flex flex-col gap-5 max-w-[800px] w-full min-w-[300px] items-center justify-center px-5'>
				<div
					className={`sm:border-2 sm:border-brand rounded flex flex-col justify-center gap-6 sm:py-14 sm:px-10 items-center w-full relative`}>
					<section className={`w-full flex flex-col items-center flex-grow`}>
						<span className={`flex flex-col gap-5 w-full`}>
							<div className={`w-full`}>
								<PlaylistInput />
							</div>
							<Options />

							<SubmitButtion />
						</span>
					</section>
					<ResultLink />
				</div>
				<History />
			</section>
		</AllDiscoverTracksContext>
	);
};

export default Page;
