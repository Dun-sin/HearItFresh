import './globals.css';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/authContext';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import MainContainer from './components/mainContainer';
import { ThemeProvider } from './context/themeContext';
import { ToastContainer } from 'react-toastify';

import Content from './components/ConnectSpotify/Content';

export const metadata: Metadata = {
	title: 'HearItFresh',
	description: 'Discover Fresh Tracks that Fit Your Style',
};
const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<body className={inter.className}>
				<AuthProvider>
					<ThemeProvider>
						<div className='relative'>
							<MainContainer>
								{children}
								<ToastContainer
									autoClose={2500}
									hideProgressBar
									closeOnClick
									pauseOnHover={false}
								/>
							</MainContainer>
							<Content />
						</div>
					</ThemeProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
