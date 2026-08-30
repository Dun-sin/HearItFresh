import { NextResponse } from 'next/server';
import { deleteYoutubeConnection } from '@/app/lib/providers/youtube/auth';

export async function POST(req: Request) {
	const { userId } = await req.json();
	if (!userId) {
		return NextResponse.json({ error: 'userId is required' }, { status: 400 });
	}

	await deleteYoutubeConnection(userId);
	return NextResponse.json({ ok: true });
}
