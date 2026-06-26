import prisma from '@/app/lib/prisma';
import { getInngestEventRuns } from '@/app/lib/inngest';
import {
	formatPlaylistOutput,
	normalizeOutput,
	normalizeStatus,
} from '@/app/lib/utils';

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const eventId = searchParams.get('eventId');
	const userId = searchParams.get('userId');
	const playlistDbId = searchParams.get('playlistDbId');

	if (!eventId) return Response.json({ error: 'No eventId' }, { status: 400 });

	const data = await getInngestEventRuns(eventId);
	const run = data?.[0];

	const status = normalizeStatus(run?.status);
	const runId = run?.run_id;
	const output = normalizeOutput(run?.output);

	if (userId && runId && playlistDbId) {
		try {
			await prisma.generatedPlaylist.updateMany({
				where: {
					userId,
					id: playlistDbId,
					inngestRunId: { not: runId },
				},
				data: {
					inngestRunId: runId,
				},
			});
		} catch (error) {
			console.error('Failed to update playlist runId:', error);
		}
	}

	if ((status === 'Cancelled' || status === 'Failed') && userId && playlistDbId) {
		try {
			await prisma.generatedPlaylist.updateMany({
				where: {
					userId,
					id: playlistDbId,
					status: { not: status === 'Cancelled' ? 'cancelled' : 'failed' }, 
				},
				data: {
					status: status === 'Cancelled' ? 'cancelled' : 'failed',
					errorMessage:
						status === 'Failed'
							? (run?.output?.error ?? 'Unknown error')
							: null,
				},
			});
		} catch (error) {
			console.error('Failed to update playlist status:', error);
		}
	}

	let lastPlaylist = null;
	if (userId && playlistDbId) {
		try {
			lastPlaylist = await prisma.generatedPlaylist.findFirst({
				where: {
					userId,
					id: playlistDbId,
					status: 'completed',
				},
				orderBy: {
					completedAt: 'desc',
				},
			});
		} catch (error) {
			console.error('Failed to fetch last playlist:', error);
		}
	}

	return Response.json({
		status,
		output: output ?? formatPlaylistOutput(lastPlaylist),
		runId,
		lastPlaylist: formatPlaylistOutput(lastPlaylist),
	});
}