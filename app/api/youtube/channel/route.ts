import { NextResponse } from 'next/server';
import { resolveYoutubeAccessToken } from '@/app/lib/providers/youtube/auth';
import { hasYoutubeChannel } from '@/app/lib/providers/youtube/client';

export async function POST(req: Request) {
	const { userId, youtubeGuestCredentials } = await req.json();

	if (!userId && !youtubeGuestCredentials) {
		return NextResponse.json(
			{ error: 'userId or youtubeGuestCredentials is required' },
			{ status: 400 },
		);
	}

	try {
		const accessToken = await resolveYoutubeAccessToken({
			userId,
			youtubeGuestCredentials,
		});
		return NextResponse.json({
			hasChannel: await hasYoutubeChannel(accessToken),
		});
	} catch (error: any) {
		console.error('[youtube/channel] check failed:', error?.message);
		return NextResponse.json(
			{ error: 'Failed to check YouTube channel' },
			{ status: 500 },
		);
	}
}
