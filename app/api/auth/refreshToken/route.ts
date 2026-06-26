import axios, { AxiosError } from 'axios';

import { NextResponse } from 'next/server';
import { decrypt, encrypt } from '@/app/lib/utils';

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;

// Note: Refresh token endpoint doesn't use redirect_uri

async function getGoogleUser(access_token: string) {
	if (!access_token) return null;

	try {
		const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: {
				'Authorization': `Bearer ${access_token}`,
			},
		});

		const { name, id, picture } = response.data;
		const user = {
			display_name: name,
			user_id: id,
			profile_image_url: picture,
		};

		return user;
	} catch (error) {
		console.error('Failed to fetch Google user info:', error);
		return null;
	}
}

export async function POST(req: Request) {
	const res = await req.json();
	const encryptedRefreshToken = res.refresh_token;
	const refreshToken = decrypt(encryptedRefreshToken);

	if (!refreshToken) {
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
	}

	try {
		const body = new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: refreshToken,
			client_id: client_id || '',
			client_secret: client_secret || '',
		}).toString();

		const response = await axios.post(
			'https://oauth2.googleapis.com/token',
			body,
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			},
		);

		const { access_token, refresh_token, expires_in } = response.data;
		const user = await getGoogleUser(access_token);
		// Google doesn't always return a new refresh_token on refresh;
		// when missing, re-use the encrypted token the client already has
		const encryptedRefresh = refresh_token
			? encrypt(refresh_token)
			: encryptedRefreshToken;
		return NextResponse.json(
			{ expires_in, refresh_token: encryptedRefresh, access_token, user },
			{ status: 200 },
		);
	} catch (error) {
		console.error('Google refresh token exchange failed');
		const axiosErr = error as AxiosError | any;
		if (axiosErr?.response?.data) {
			console.error('Google response:', axiosErr.response.data);
			return NextResponse.json(
				{ google_error: axiosErr.response.data },
				{ status: 400 },
			);
		}

		console.error(error);
		return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
	}
}
