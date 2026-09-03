import { inngest } from '@/app/inngest/client';

export async function POST(req: Request) {
	const { cancellationId } = await req.json();

	if (!cancellationId) {
		return Response.json(
			{ error: 'No cancellationId provided' },
			{ status: 400 },
		);
	}

	try {
		await inngest.send({
			name: 'playlist/cancel',
			data: { cancellationId },
		});
	} catch (error) {
		console.error('[cancel] Inngest cancel failed:', error);
		return Response.json({ error: 'Failed to cancel run' }, { status: 500 });
	}

	return Response.json({ success: true });
}
