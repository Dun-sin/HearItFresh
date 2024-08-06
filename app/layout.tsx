import './globals.css';

import { AuthProvider } from './context/authContext';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';

import SpotifyAuthWrapper from './components/SpotifyAuthWrapper';
import { ThemeProvider } from './context/themeContext';

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
						<SpotifyAuthWrapper>{children}</SpotifyAuthWrapper>
					</ThemeProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
