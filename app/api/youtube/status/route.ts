import { NextResponse } from 'next/server';
import { getYoutubeConnectionStatus } from '@/app/lib/providers/youtube/auth';

export async function GET(req: Request) {
	const url = new URL(req.url);
	const userId = url.searchParams.get('userId');
	if (!userId) {
		return NextResponse.json({ connected: false });
	}

	const status = await getYoutubeConnectionStatus(userId);
	return NextResponse.json(status);
}
