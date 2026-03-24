'use client';

import axios, { AxiosResponse } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import spotifyApi from '@/app/lib/spotifyApi';
import { useAuth } from '@/app/context/authContext';
import useRefreshToken from '@/app/hooks/useRefreshToken';

const ConnectSpotify = ({ authUrl }: { authUrl: string }) => {
  const { isAuthInProgress, isLoggedIn, authInProgress, logIn, setUserData, setAccessToken } =
    useAuth();

  const [expires, setExpires] = useState<number | null>(null);
  const isExchangingCode = useRef(false);

  const currentPath = usePathname();

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      console.log('ConnectSpotify useEffect triggered');
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      const extractedCode = searchParams.get('code');

      if (extractedCode && extractedCode !== '') {
        if (isAuthInProgress || isExchangingCode.current) return;
        isExchangingCode.current = true;
        authInProgress(true);

        // Attempt to exchange the code. Only remove `code` from the URL
        // if the exchange succeeds. If it fails, keep the code visible
        // so the developer can copy it for debugging.
        const response = await loginUser(extractedCode);
        if (response?.status === 200) {
          current.delete('code');

          const search = current.toString();
          const query = search ? `?${search}` : '';

          router.push(`${currentPath}${query}`);
        } else {
          // leave the code in the URL for debugging; authInProgress
          // will be set to false in loginUser when a failure occurs
          isExchangingCode.current = false;
        }

        return;
      }

      console.log('ConnectSpotify calling refreshAccessToken() from useEffect');
      refreshAccessToken();
    })();
  }, []);

  async function loginUser(code: string) {
    if (!code) return null;
    try {
      console.log('loginUser: sending code to /api/auth...', code.substring(0, 10) + '...');
      const response = await axios.post('/api/auth', { code });
      console.log('loginUser: received response with status:', response?.status);
      processResponse(response);
      return response;
    } catch (err: any) {
      // If server returned spotify_error, surface it on client console
      console.error('Login exchange failed', err?.response?.data || err);
      authInProgress(false);
      // If the code expired, quickly redirect to start a fresh auth
      const isExpired = err?.response?.data?.spotify_error?.error_description === 'Authorization code expired';
      if (isExpired) window.location.href = authUrl;
      return err?.response || null;
    }
  }

  async function refreshAccessToken() {
    console.log('refreshAccessToken() started. isAuthInProgress:', isAuthInProgress);
    if (isAuthInProgress) {
      console.log('refreshAccessToken() aborted because isAuthInProgress is true');
      return;
    }

    authInProgress(true);
    const getRefreshToken = localStorage.getItem('refresh_token');
    console.log('refreshAccessToken: got refresh token from localStorage?', !!getRefreshToken);

    try {
      if (getRefreshToken) {
        console.log('refreshAccessToken: calling /api/auth/refreshToken...');
        const response = await axios.post('/api/auth/refreshToken', {
          refresh_token: getRefreshToken,
        });
        console.log('refreshAccessToken: received response status:', response?.status);
        processResponse(response);
      } else {
        console.log('refreshAccessToken: no refresh_token found, setting authInProgress to false');
        authInProgress(false);
      }
    } catch (error) {
      console.error('Failed to refresh Spotify access token', error);
      authInProgress(false);
    }
  }

  function storeToLocalStore(expires_in: number, refresh_token: string, access_token: string) {
    console.log('storeToLocalStore called with expires:', expires_in);
    setExpires(expires_in);

    const currentTime = Date.now();
    localStorage.setItem('expires', currentTime + expires_in * 1000 + '');
    
    if (access_token) {
      console.log('storeToLocalStore: Saving access_token');
      localStorage.setItem('access_token', access_token);
    } else {
      console.log('storeToLocalStore: NOT saving access_token (falsy)');
    }
    
    if (refresh_token) {
      console.log('storeToLocalStore: Saving refresh_token');
      // refresh_token is already encrypted by the server
      localStorage.setItem('refresh_token', refresh_token);
    } else {
      console.log('storeToLocalStore: NOT saving refresh_token (falsy)');
    }
  }

  function setToSpotifyAPI(
    access_token: string,
    refresh_token: string,
    expires_in: number,
  ) {
    logIn();

    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    storeToLocalStore(expires_in, refresh_token, access_token);
  }

  function processResponse(response: AxiosResponse<any, any>) {
    console.log('processResponse running. Status:', response.status);
    const { expires_in, refresh_token, access_token, user } = response.data;
    console.log('processResponse data extracted - has refresh_token?', !!refresh_token, 'has access_token?', !!access_token);
    if (response.status === 200) {
      console.log('processResponse: calling setToSpotifyAPI...');
      setToSpotifyAPI(access_token, refresh_token, expires_in);
      setUserData(user);
      setAccessToken(access_token);
    } else {
      console.log('processResponse: ignored because status !== 200');
    }
  }

  useRefreshToken(expires, refreshAccessToken);

  return (
    !isLoggedIn && (
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
    )
  );
};

export default ConnectSpotify;
