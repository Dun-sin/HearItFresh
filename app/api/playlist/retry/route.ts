import { inngest } from '@/app/inngest/client';
import prisma from '@/app/lib/prisma';

export async function POST(req: Request) {
	const { playlistDbId } = await req.json();

	if (!playlistDbId) {
		return Response.json({ error: 'No playlistDbId provided' }, { status: 400 });
	}

	const record = await prisma.generatedPlaylist.findUnique({
		where: { id: playlistDbId },
	});

	if (!record || record.status === 'completed') {
		return Response.json({ error: 'Invalid or completed playlist record' }, { status: 400 });
	}

	const newJobId = Math.random().toString(36).substring(2, 15);

	await prisma.generatedPlaylist.update({
		where: { id: playlistDbId },
		data: {
			inngestRunId: newJobId,
			inngestEventId: '',
			status: 'pending',
			retryCount: { increment: 1 },
			errorMessage: null,
		},
	});

	const seeds = record.seeds as any[] | undefined;
	const artistNames = seeds?.map((s) => s.artist).flat() ?? [];

	const { ids } = await inngest.send({
		name: 'playlist/generate',
		data: {
			seeds,
			artistNames,
			options: {},
			userId: record.userId,
			jobId: newJobId,
			sourcePlaylistId: record.sourcePlaylistId,
		},
	});

	return Response.json({ eventId: ids[0], playlistDbId: record.id });
}