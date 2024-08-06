import { GeneralStateProvider } from '@/app/context/DiscoverTracks/generalStateContext';
import { InputProvider } from '@/app/context/DiscoverTracks/inputContext';
import { LoadingProvider } from '@/app/context/DiscoverTracks/loadingContext';
import { ReactNode } from 'react';
import { TypeProvider } from '@/app/context/DiscoverTracks/typeContext';

const AllDiscoverTracksContext: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	return (
		<LoadingProvider>
			<GeneralStateProvider>
				<InputProvider>
					<TypeProvider>{children}</TypeProvider>
				</InputProvider>
			</GeneralStateProvider>
		</LoadingProvider>
	);
};

export default AllDiscoverTracksContext;
