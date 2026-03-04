import { GeneralStateProvider } from '@/app/context/generalStateContext';
import { HistoryProvider } from '../context/HistoryContext';
import { InputProvider } from '@/app/context/inputContext';
import { LoadingProvider } from '@/app/context/loadingContext';
import { ReactNode } from 'react';
import { SeedSongsProvider } from '@/app/context/DiscoverTracks/seedSongsContext';

const AllContext: React.FC<{ children: ReactNode }> = ({ children }) => {
	return (
		<LoadingProvider>
			<GeneralStateProvider>
				<HistoryProvider>
          <InputProvider>
            <SeedSongsProvider>{children}</SeedSongsProvider>
          </InputProvider>
				</HistoryProvider>
			</GeneralStateProvider>
		</LoadingProvider>
	);
};

export default AllContext;
