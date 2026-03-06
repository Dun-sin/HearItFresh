import { inngest } from '@/app/inngest/client';

export async function POST(req: Request) {
	const { seeds, artistNames, options, accessToken, userId } = await req.json();

	const { ids } = await inngest.send({
		name: 'playlist/generate',
		data: { seeds, artistNames, options, accessToken, userId },
	});

	return Response.json({ eventId: ids[0] });
}
