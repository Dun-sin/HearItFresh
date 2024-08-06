'use client';

import { decrypt, encrypt } from '../lib/utils';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Icon } from '@iconify/react';
import Link from 'next/link';
import axios from 'axios';
import spotifyApi from '../lib/spotifyApi';
import { useAuth } from '../context/authContext';
import useRefreshToken from '../hooks/useRefreshToken';
import { useTheme } from '../context/themeContext';

const Header = () => {
	const { isDarkMode, toggleDarkMode } = useTheme();
	const { isLoggedIn, logIn, logOut, authInProgress, isAuthInProgress } =
		useAuth();

	const [expires, setExpires] = useState<number | null>(null);
	const [openTools, setOpenTools] = useState(false);

	const currentPath = usePathname();
	const searchParams = useSearchParams();
	const router = useRouter();

	useEffect(() => {
		const current = new URLSearchParams(Array.from(searchParams.entries()));
		const extractedCode = searchParams.get('code');

		if (extractedCode && extractedCode !== '') {
			if (isAuthInProgress) return;
			authInProgress(true);
			loginUser(extractedCode);
			current.delete('code');

			const search = current.toString();
			const query = search ? `?${search}` : '';

			router.push(`${currentPath}${query}`);
			return;
		}

		refreshAccessToken();
	}, []);

	async function loginUser(code: string) {
		if (!code) return;
		const response = await axios.post('/api/auth', { code });
		const { expires_in, refresh_token, access_token } = response.data;
		response.status === 200 &&
			setToSpotifyAPI(access_token, refresh_token, expires_in);
	}

	function storeToLocalStore(expires_in: number, refresh_token: string) {
		setExpires(expires_in);

		const currentTime = Date.now();
		localStorage.setItem('expires', currentTime + expires_in * 1000 + '');
		if (refresh_token === '' || !refresh_token) return;
		localStorage.setItem('refresh_token', encrypt(refresh_token));
	}

	function setToSpotifyAPI(
		access_token: string,
		refresh_token: string,
		expires_in: number,
	) {
		logIn();

		spotifyApi.setAccessToken(access_token);
		spotifyApi.setRefreshToken(refresh_token);

		storeToLocalStore(expires_in, refresh_token);
	}

	async function refreshAccessToken() {
		if (isAuthInProgress) return;

		authInProgress(true);
		const getRefreshToken = localStorage.getItem('refresh_token');

		try {
			if (getRefreshToken) {
				const refreshtoken = decrypt(getRefreshToken);

				if (!refreshtoken || refreshtoken === '') {
					authInProgress(false);
					return;
				}

				const response = await axios.post('/api/auth/refreshToken', {
					refresh_token: refreshtoken,
				});
				const { expires_in, refresh_token, access_token } = response.data;

				response.status === 200 &&
					setToSpotifyAPI(access_token, refresh_token, expires_in);
			} else {
				authInProgress(false);
			}
		} catch (error) {
			throw Error(error as string);
		}
	}

	useRefreshToken(expires, refreshAccessToken);

	return (
		<div className={`flex items-center justify-between px-6 top-6 relative`}>
			<div className='sm:flex flex-col hidden'>
				<Link href='/'>
					<h1 className={`font-bold mb-[-6px] text-fmd flex items-center`}>
						HearItFresh
						<Icon
							icon='material-symbols:music-note-rounded'
							width='20'
							height='20'
							inline={true}
						/>
					</h1>
				</Link>
				<p className={`text-fsm dark:text-gray text-dark`}>
					Discover Fresh Tracks that Fit Your Style
				</p>
			</div>

			<button
				onClick={() => setOpenTools(!openTools)}
				className='opacity-55 text-fsm sm:text-fbase'>
				Change Tools
			</button>

			{openTools && (
				<div className='absolute top-14 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4'>
					{currentPath !== '/' && (
						<Link
							className={`underline decoration-4 underline-offset-4 cursor-pointer decoration-brand`}
							href='/'
							onClick={() => setOpenTools(false)}>
							Discover Tracks
						</Link>
					)}
					{currentPath !== '/toptracks' && (
						<Link
							className={`underline decoration-4 underline-offset-4 cursor-pointer decoration-brand`}
							href='/toptracks'
							onClick={() => setOpenTools(false)}>
							Top Tracks
						</Link>
					)}
				</div>
			)}
			<div className='flex items-center gap-2 sm:gap-5 '>
				{isLoggedIn && (
					<button
						className={`text-brand underline underline-offset-1 text-fsm sm:text-fbase`}
						onClick={logOut}>
						SignOut
					</button>
				)}
				<div
					className='text-xl cursor-pointer rounded-full bg-brand p-1 text-lightest'
					onClick={toggleDarkMode}>
					{isDarkMode ? (
						<Icon icon='ic:round-dark-mode' className='w-3 h-4 sm:w-6 sm:h-6' />
					) : (
						<Icon
							icon='ic:round-light-mode'
							className='w-3 h-4 sm:w-6 sm:h-6'
						/>
					)}
				</div>
				<a
					href='https://www.buymeacoffee.com/dunsinCodes'
					target='_blank'
					className={` border-brand border-2 h-8 w-28 text-fxs rounded-lg flex items-center justify-center cursor-pointer sm:w-40 font-semibold `}>
					Buy Me A Coffee
				</a>
			</div>
		</div>
	);
};

export default Header;
