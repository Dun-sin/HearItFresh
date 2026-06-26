import axios, { AxiosError } from "axios";

import { NextResponse } from "next/server";
import { encrypt } from '@/app/lib/utils';
import prisma from '@/app/lib/prisma';

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;

async function getGoogleUser(access_token: string) {
	if (!access_token) return null;

	try {
		const response = await axios.get(
			'https://www.googleapis.com/oauth2/v2/userinfo',
			{
				headers: {
					Authorization: `Bearer ${access_token}`,
				},
			},
		);

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
	const code = res.code;

	const url = new URL(req.url);
	const redirect_uri = `${url.origin}`;

	// Log the incoming authorization code to help debugging (non-secret, short lived)
	console.info('Received Google authorization code:', code);
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
			redirect_uri,
			client_id: client_id || '',
			client_secret: client_secret || '',
		}).toString();

		// Log the redirect and client id used for the token exchange to help
		// diagnose redirect_uri mismatches which commonly cause invalid_grant.
		console.info('Token exchange using redirect_uri:', redirect_uri);
		console.info('Token exchange using client_id:', client_id);

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

		if (user) {
			await prisma.user.upsert({
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
			{
				expires_in,
				refresh_token: refresh_token ? encrypt(refresh_token) : undefined,
				access_token,
				user,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error('Google token exchange failed');
		// If axios error, surface Google's error body for debugging
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
