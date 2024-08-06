'use client';

import Header from './Header';
import Loading from './Loading';
import { OptionsProvider } from '../context/optionsContext';
import { Suspense } from 'react';
import { useTheme } from '../context/themeContext';

const SpotifyAuthWrapper = ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	const { isDarkMode } = useTheme();

	return (
		<section
			className={`h-screen dark:bg-darkest bg-lightest dark:text-white text-darkest relative flex flex-col overflow-hidden ${
				isDarkMode && 'dark'
			}`}>
			<Suspense fallback={<Loading loadingMessage='Please Wait...' />}>
				<Header />
				<div className='flex flex-grow gap-4 items-center justify-center w-full'>
					<main className='w-full flex items-center justify-center'>
						<OptionsProvider>{children}</OptionsProvider>
					</main>
				</div>
			</Suspense>
		</section>
	);
};

export default SpotifyAuthWrapper;
