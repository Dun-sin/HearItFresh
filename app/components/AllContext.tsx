import { GeneralStateProvider } from '@/app/context/generalStateContext';
import { InputProvider } from '@/app/context/inputContext';
import { LoadingProvider } from '@/app/context/loadingContext';
import { ReactNode } from 'react';

const AllContext: React.FC<{ children: ReactNode }> = ({ children }) => {
	return (
		<LoadingProvider>
			<GeneralStateProvider>
				<InputProvider>{children}</InputProvider>
			</GeneralStateProvider>
		</LoadingProvider>
	);
};

export default AllContext;
