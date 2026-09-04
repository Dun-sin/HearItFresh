import { inngest } from '@/app/inngest/client';
import prisma from '@/app/lib/prisma';

export async function POST(req: Request) {
	const { cancellationId, generatedPlaylistId } = await req.json();

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

	// Saves reconcile a round trip on the next load; it would reach the same
	// state from the run's Cancelled status anyway.
	if (generatedPlaylistId) {
		try {
			await prisma.generatedPlaylist.update({
				where: { id: generatedPlaylistId },
				data: { status: 'cancelled', errorMessage: 'Generation was cancelled' },
			});
		} catch (error) {
			console.error('[cancel] Failed to mark record cancelled:', error);
		}
	}

	return Response.json({ success: true });
}
