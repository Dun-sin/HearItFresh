import axios, { AxiosError } from 'axios';

import { NextResponse } from 'next/server';
import { getUser } from '@/app/lib/spotify';

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

export async function POST(req: Request) {
	const res = await req.json();
	const refreshToken = res.refresh_token;

	if (!refreshToken) {
		return Response.json({ error: 'Invalid request' }, { status: 400 });
	}

	try {
		const response = await axios.post(
			'https://accounts.spotify.com/api/token',
			{
				grant_type: 'refresh_token',
				client_id,
				refresh_token: refreshToken,
			},
			{
				headers: {
					'content-Type': 'application/x-www-form-urlencoded',
					Authorization:
						'Basic ' +
						Buffer.from(client_id + ':' + client_secret).toString('base64'),
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
		error = error as AxiosError;

		return NextResponse.json({ error }, { status: 400 });
	}
}
