import { inngest } from '@/app/inngest/client';
import prisma from '@/app/lib/prisma';

export async function POST(req: Request) {
	const { seeds, artistNames, options, userId, sourcePlaylistId } =
		await req.json();

	let dbRecord: { id: string } | null = null;

	try {
		dbRecord = await prisma.generatedPlaylist.create({
			data: {
				userId,
				sourcePlaylistId,
				status: 'pending',
				seeds,
			},
		});
	} catch (error: any) {
		console.error('Failed to create playlist DB record:', error);
		return Response.json(
			{ error: error.message || 'Failed to create generation record' },
			{ status: 500 },
		);
	}

	try {
		const eventData = {
			seeds,
			artistNames,
			options,
			userId,
			sourcePlaylistId,
			generatedPlaylistId: dbRecord.id,
		};
		const { ids } = await inngest.send({
			name: 'playlist/generate',
			data: eventData,
		});

		await prisma.generatedPlaylist.update({
			where: { id: dbRecord.id },
			data: {
				event: {
					name: 'playlist/generate',
					id: ids[0],
					data: eventData,
				},
			},
		});

		return Response.json({ eventId: ids[0], playlistDbId: dbRecord.id });
	} catch (error: any) {
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
			console.error(
				'Failed to update DB record to failed after Inngest error:',
				dbError,
			);
		}
		return Response.json(
			{ error: error.message || 'Failed to start generation' },
			{ status: 500 },
		);
	}
}
