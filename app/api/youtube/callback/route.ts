import { NextResponse } from 'next/server';
import axios from 'axios';
import {
	upsertYoutubeConnection,
	verifyYoutubeState,
} from '@/app/lib/providers/youtube/auth';
import { encrypt } from '@/app/lib/utils';

type PopupPayload =
	| { status: 'error' | 'no_refresh' }
	| { status: 'connected'; userId: string }
	| {
			status: 'connected';
			guestCredentials: { accessToken: string; refreshToken: string; expiresAt: string };
	  };

function renderPopupResult(origin: string, payload: PopupPayload) {
	const html = `<!doctype html><html><body>
<script>
  if (window.opener) {
    window.opener.postMessage(Object.assign({ type: 'youtube-oauth' }, ${JSON.stringify(payload)}), ${JSON.stringify(origin)});
  }
  // Give the postMessage task time to reach the opener before this window
  // tears down — closing immediately can race the message delivery.
  setTimeout(function () { window.close(); }, 150);
</script>
</body></html>`;
	return new NextResponse(html, {
		headers: { 'Content-Type': 'text/html' },
	});
}

export async function GET(req: Request) {
	const url = new URL(req.url);
	const code = url.searchParams.get('code');
	const rawState = url.searchParams.get('state');
	const origin = url.origin;

	const stateResult = rawState ? verifyYoutubeState(rawState) : { ok: false as const };

	if (!code || !stateResult.ok) {
		return renderPopupResult(origin, { status: 'error' });
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
			return renderPopupResult(origin, { status: 'no_refresh' });
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
			return renderPopupResult(origin, {
				status: 'connected',
				userId: stateResult.userId,
			});
		}

		return renderPopupResult(origin, {
			status: 'connected',
			guestCredentials: {
				accessToken: access_token,
				refreshToken: encrypt(refresh_token),
				expiresAt: expiresAt.toISOString(),
			},
		});
	} catch (error) {
		console.error('YouTube connect callback failed', error);
		return renderPopupResult(origin, { status: 'error' });
	}
}
