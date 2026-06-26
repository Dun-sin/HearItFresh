'use client';

import { Suspense, useEffect, useState } from 'react';
import Loading from '../Loading';
import ConnectSpotify from '.';

const Content = () => {
	const [authUrl, setAuthUrl] = useState('');

	useEffect(() => {
		const redirectUri = `${window.location.origin}`;
		const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
		
		const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email&access_type=offline&prompt=consent`;
		setAuthUrl(url);
	}, []);

	return (
		<Suspense fallback={<Loading loadingMessage='Please Wait...' />}>
			<ConnectSpotify authUrl={authUrl} />
		</Suspense>
	);
};

export default Content;
