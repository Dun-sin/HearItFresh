'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/authContext';
import { Suspense, useEffect, useState } from 'react';
import axios, { AxiosResponse } from 'axios';
import { decrypt, encrypt } from '../lib/utils';
import spotifyApi from '../lib/spotifyApi';
import useRefreshToken from '../hooks/useRefreshToken';
import Loading from './Loading';

const ConnectSpotify = ({ authUrl }: { authUrl: string }) => {
	const { isAuthInProgress, isLoggedIn, authInProgress, logIn, setUserData } =
		useAuth();

	const [expires, setExpires] = useState<number | null>(null);

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
		processResponse(response);
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
				processResponse(response);
			} else {
				authInProgress(false);
			}
		} catch (error) {
			throw Error(error as string);
		}
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

	function processResponse(response: AxiosResponse<any, any>) {
		const { expires_in, refresh_token, access_token, user } = response.data;
		if (response.status === 200) {
			setToSpotifyAPI(access_token, refresh_token, expires_in);
			setUserData(user);
		}
	}

	useRefreshToken(expires, refreshAccessToken);

	return (
		<Suspense fallback={<Loading loadingMessage='Please Wait...' />}>
			{!isLoggedIn && (
				<div className='absolute top-0 w-full h-full flex items-center justify-center backdrop-blur-sm bg-lightest/45 flex-col'>
					<p className={`text-flg md:text-fmd font-bold`}>
						{isAuthInProgress
							? 'Connecting your spotify'
							: 'Please login to connect your spotify and use this tool'}
					</p>
					{!isAuthInProgress && (
						<a
							href={authUrl}
							className='px-4 py-2 bg-brand rounded-md text-lightest'>
							Connect Your Spotify
						</a>
					)}
				</div>
			)}
		</Suspense>
	);
};

export default ConnectSpotify;
