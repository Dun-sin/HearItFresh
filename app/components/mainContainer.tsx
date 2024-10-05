'use client';

import Header from './Header';

import { OptionsProvider } from '../context/optionsContext';

import { useTheme } from '../context/themeContext';

const MainContainer = ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	const { isDarkMode } = useTheme();

	return (
		<section
			className={`h-screen dark:bg-darkest bg-lightest dark:text-white text-darkest relative flex flex-col items-center ${
				isDarkMode && 'dark'
			}`}>
			<div className='w-full max-w-7xl h-fit flex justify-center sticky top-0 pt-6 bg-lightest dark:bg-darkest'>
				<Header />
			</div>
			<div className='flex flex-grow gap-4 items-center justify-center w-full'>
				<main className='w-full flex items-center justify-center py-10'>
					<OptionsProvider>{children}</OptionsProvider>
				</main>
			</div>
		</section>
	);
};

export default MainContainer;
