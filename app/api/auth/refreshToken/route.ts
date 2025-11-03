import axios, { AxiosError } from 'axios';

import { NextResponse } from 'next/server';
import { getUser } from '@/app/lib/spotify';

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

export async function POST(req: Request) {
	const res = await req.json();
	const refreshToken = res.refresh_token;

	if (!refreshToken) {
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
	}

	try {
		const body = new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: refreshToken,
			client_id: client_id || '',
		}).toString();

		const response = await axios.post(
			'https://accounts.spotify.com/api/token',
			body,
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Authorization:
						'Basic ' +
						Buffer.from(`${client_id}:${client_secret}`).toString('base64'),
				},
			},
		);

		const { access_token, refresh_token, expires_in } = response.data;
		const user = await getUser(access_token);
		return NextResponse.json(
			{ expires_in, refresh_token, access_token, user },
			{ status: 200 },
		);
	} catch (error) {
		console.error('Spotify refresh token exchange failed');
		const axiosErr = error as AxiosError | any;
		if (axiosErr?.response?.data) {
			console.error('Spotify response:', axiosErr.response.data);
			return NextResponse.json(
				{ spotify_error: axiosErr.response.data },
				{ status: 400 },
			);
		}

		console.error(error);
		return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
	}
}
