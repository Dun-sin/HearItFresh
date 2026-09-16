import { NextResponse } from 'next/server';
import { YOUTUBE_SCOPE, signYoutubeState } from '@/app/lib/providers/youtube/auth';

export async function GET(req: Request) {
	const url = new URL(req.url);
	const userId = url.searchParams.get('userId');

	const origin = url.origin;
	const redirectUri = `${origin}/api/youtube/callback`;

	const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
	authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || '');
	authUrl.searchParams.set('redirect_uri', redirectUri);
	authUrl.searchParams.set('response_type', 'code');
	authUrl.searchParams.set('scope', YOUTUBE_SCOPE);
	authUrl.searchParams.set('access_type', 'offline');
	authUrl.searchParams.set('prompt', 'consent');

	authUrl.searchParams.set('state', signYoutubeState(userId));

	return NextResponse.redirect(authUrl.toString());
}
