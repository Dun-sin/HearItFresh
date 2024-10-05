import { GeneralStateProvider } from '@/app/context/generalStateContext';
import { HistoryProvider } from '../context/HistoryContext';
import { InputProvider } from '@/app/context/inputContext';
import { LoadingProvider } from '@/app/context/loadingContext';
import { ReactNode } from 'react';

const AllContext: React.FC<{ children: ReactNode }> = ({ children }) => {
	return (
		<LoadingProvider>
			<GeneralStateProvider>
				<HistoryProvider>
					<InputProvider>{children}</InputProvider>
				</HistoryProvider>
			</GeneralStateProvider>
		</LoadingProvider>
	);
};

export default AllContext;
