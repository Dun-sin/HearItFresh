import { GeneralStateProvider } from '@/app/context/generalStateContext';
import { HistoryProvider } from '../context/HistoryContext';
import { InputProvider } from '@/app/context/inputContext';
import { LoadingProvider } from '@/app/context/loadingContext';
import { ReactNode } from 'react';
import { SeedSongsProvider } from '@/app/context/seedSongsContext';
import { YoutubeChannelProvider } from '@/app/context/youtubeChannelContext';

const AllContext: React.FC<{ children: ReactNode }> = ({ children }) => {
	return (
		<LoadingProvider>
			<GeneralStateProvider>
				<HistoryProvider>
          <InputProvider>
            <SeedSongsProvider>
              <YoutubeChannelProvider>{children}</YoutubeChannelProvider>
            </SeedSongsProvider>
          </InputProvider>
				</HistoryProvider>
			</GeneralStateProvider>
		</LoadingProvider>
	);
};

export default AllContext;
