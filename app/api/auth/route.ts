import axios, { AxiosError } from "axios";

import { NextResponse } from "next/server";
import { getUser } from '@/app/lib/spotify';
import prisma from '@/app/lib/prisma';

const redirect_uri = process.env.REDIRECT_URL;
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

export async function POST(req: Request) {
	const res = await req.json();
	const code = res.code;

	// Log the incoming authorization code to help debugging (non-secret, short lived)
	console.info('Received Spotify authorization code:', code);
	// Log some diagnostics about the code
	console.info('Auth code length:', code?.length);
	if (code && /\s/.test(code)) {
		console.warn(
			'Auth code contains whitespace characters which may indicate copying issues',
		);
	}
	if (!code) {
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
	}

	try {
		const body = new URLSearchParams({
			grant_type: 'authorization_code',
			code,
			redirect_uri: redirect_uri || '',
		}).toString();

		// Log the redirect and client id used for the token exchange to help
		// diagnose redirect_uri mismatches which commonly cause invalid_grant.
		console.info('Token exchange using redirect_uri:', redirect_uri);
		console.info('Token exchange using client_id:', client_id);

		const response = await axios.post(
			'https://accounts.spotify.com/api/token',
			body,
			{
				headers: {
					Authorization:
						'Basic ' +
						Buffer.from(`${client_id}:${client_secret}`).toString('base64'),
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			},
		);

		const { access_token, refresh_token, expires_in } = response.data;
		const user = await getUser(access_token);

		if (user) {
			const prismaUser = await prisma.user.upsert({
				where: { userId: user.user_id },
				create: {
					displayName: user.display_name!,
					userId: user.user_id,
					profileImageUrl: user.profile_image_url,
				},
				update: {},
			});
		}

		return NextResponse.json(
			{ expires_in, refresh_token, access_token, user },
			{ status: 200 },
		);
	} catch (error) {
		console.error('Spotify token exchange failed');
		// If axios error, surface Spotify's error body for debugging
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
