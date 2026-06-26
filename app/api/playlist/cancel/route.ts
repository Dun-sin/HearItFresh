import { inngest } from '@/app/inngest/client';
import prisma from '@/app/lib/prisma';

export async function POST(req: Request) {
	const { playlistDbId } = await req.json();

	if (!playlistDbId) return Response.json({ error: 'No playlistDbId provided' }, { status: 400 });

	const record = await prisma.generatedPlaylist.findUnique({
		where: { id: playlistDbId },
	});

	if (!record) return Response.json({ error: 'Playlist record not found' }, { status: 404 });
	if (!record.inngestRunId) return Response.json({ error: 'No active run to cancel' }, { status: 400 });

	try {
		await inngest.send({
			name: 'playlist/cancel',
			data: { generatedPlaylistId: playlistDbId, runId: record.inngestRunId },
		});
	} catch (error) {
		console.error('[cancel] Inngest cancel failed:', error);
		return Response.json({ error: 'Failed to cancel run' }, { status: 500 });
	}

	return Response.json({ success: true });
}