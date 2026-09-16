import { NextResponse } from 'next/server';
import axios from 'axios';
import {
	upsertYoutubeConnection,
	verifyYoutubeState,
} from '@/app/lib/providers/youtube/auth';
import { encrypt } from '@/app/lib/utils';

function fail(origin: string, status: 'error' | 'no_refresh', reason: string) {
	console.error(`[youtube/callback] ${status}: ${reason}`);
	return NextResponse.redirect(
		`${origin}/?youtube=${status}&reason=${encodeURIComponent(reason)}`,
	);
}

export async function GET(req: Request) {
	const url = new URL(req.url);
	const code = url.searchParams.get('code');
	const rawState = url.searchParams.get('state');
	const googleError = url.searchParams.get('error');
	const origin = url.origin;

	if (googleError) {
		return fail(origin, 'error', `Google returned error=${googleError}`);
	}
	const stateResult = rawState ? verifyYoutubeState(rawState) : { ok: false as const };

	if (!stateResult.ok) {
		return fail(
			origin,
			'error',
			rawState ? 'state signature invalid or expired' : 'missing state param',
		);
	}

	if (!code) {
		return fail(origin, 'error', 'missing code param');
	}

	const redirectUri = `${origin}/api/youtube/callback`;

	try {
		const body = new URLSearchParams({
			grant_type: 'authorization_code',
			code,
			redirect_uri: redirectUri,
			client_id: process.env.GOOGLE_CLIENT_ID || '',
			client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
		}).toString();

		const res = await axios.post('https://oauth2.googleapis.com/token', body, {
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		});

		const { access_token, refresh_token, expires_in, scope } = res.data;

		if (!refresh_token) {
			return fail(
				origin,
				'no_refresh',
				'Google did not return a refresh_token (likely already consented without prompt=consent, or offline access not granted)',
			);
		}

		const expiresAt = new Date(Date.now() + (expires_in ?? 3600) * 1000);

		if (stateResult.userId) {
			await upsertYoutubeConnection({
				userId: stateResult.userId,
				accessToken: access_token,
				refreshToken: refresh_token,
				expiresAt,
				scope,
			});
			return NextResponse.redirect(`${origin}/?youtube=connected`);
		}

		const fragment = new URLSearchParams({
			at: access_token,
			rt: encrypt(refresh_token),
			exp: expiresAt.toISOString(),
		});
		return NextResponse.redirect(`${origin}/?youtube=connected#${fragment.toString()}`);
	} catch (error: any) {
		const googleErrorBody = error?.response?.data;
		console.error('YouTube token exchange failed:', googleErrorBody || error);
		const reason = googleErrorBody
			? `${googleErrorBody.error}${googleErrorBody.error_description ? `: ${googleErrorBody.error_description}` : ''}`
			: error?.message || 'unknown error during token exchange';
		return fail(origin, 'error', reason);
	}
}
