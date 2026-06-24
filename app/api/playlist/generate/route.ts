import { inngest } from '@/app/inngest/client';
import prisma from '@/app/lib/prisma';

export async function POST(req: Request) {
	const { seeds, artistNames, options, userId, jobId, sourcePlaylistId } = await req.json();

	let dbRecord: { id: string } | null = null;

	try {
		dbRecord = await prisma.generatedPlaylist.create({
			data: {
				userId,
				sourcePlaylistId,
				inngestRunId: jobId,
				inngestEventId: '',
				status: 'pending',
				seeds,
			},
		});
	} catch (error: any) {
		console.error('Failed to create playlist DB record:', error);
		return Response.json({ error: error.message || 'Failed to create generation record' }, { status: 500 });
	}

	try {
		const { ids } = await inngest.send({
			name: 'playlist/generate',
			data: { seeds, artistNames, options, userId, jobId, sourcePlaylistId },
		});

		return Response.json({ eventId: ids[0], playlistDbId: dbRecord.id });
	} catch (error: any) {
		// Inngest send failed — mark the pending record as failed immediately
		console.error('Failed to send Inngest event:', error);
		try {
			await prisma.generatedPlaylist.update({
				where: { id: dbRecord.id },
				data: {
					status: 'failed',
					errorMessage: error.message || 'Failed to queue generation job',
				},
			});
		} catch (dbError) {
			console.error('Failed to update DB record to failed after Inngest error:', dbError);
		}
		return Response.json({ error: error.message || 'Failed to start generation' }, { status: 500 });
	}
}
