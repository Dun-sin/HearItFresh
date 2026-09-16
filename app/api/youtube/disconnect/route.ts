import { NextResponse } from 'next/server';
import axios from 'axios';
import { deleteYoutubeConnection } from '@/app/lib/providers/youtube/auth';
import { decrypt } from '@/app/lib/utils';

export async function POST(req: Request) {
	const { userId, guestRefreshToken } = await req.json();

	if (userId) {
		await deleteYoutubeConnection(userId);
		return NextResponse.json({ ok: true });
	}

	if (!guestRefreshToken) {
		return NextResponse.json(
			{ error: 'userId or guestRefreshToken is required' },
			{ status: 400 },
		);
	}

	try {
		await axios.post(
			'https://oauth2.googleapis.com/revoke',
			new URLSearchParams({ token: decrypt(guestRefreshToken) }),
			{ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
		);
	} catch {}

	return NextResponse.json({ ok: true });
}
