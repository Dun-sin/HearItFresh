import './globals.css';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/authContext';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import SuspenseWrapper from './components/SuspenseWrapper';
import { ThemeProvider } from './context/themeContext';
import { ToastContainer } from 'react-toastify';
import ConnectSpotify from './components/ConnectSpotify';

const authUrl = `https://accounts.spotify.com/authorize?client_id=${
	process.env.SPOTIFY_CLIENT_ID
}&response_type=code&redirect_uri=${
	process.env.REDIRECT_URL as string
}&scope=playlist-modify-public%20playlist-read-private%20user-read-private`;

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
							<SuspenseWrapper>
								{children}
								<ToastContainer
									autoClose={2500}
									hideProgressBar
									closeOnClick
									pauseOnHover={false}
								/>
							</SuspenseWrapper>
							<ConnectSpotify authUrl={authUrl} />
						</div>
					</ThemeProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
