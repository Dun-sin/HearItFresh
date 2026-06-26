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
	const jobId = searchParams.get('jobId');

	if (!eventId) return Response.json({ error: 'No eventId' }, { status: 400 });

	const data = await getInngestEventRuns(eventId);
	const run = data?.[0];

	const status = normalizeStatus(run?.status);
	const runId = run?.run_id;
	const output = normalizeOutput(run?.output);

	if (userId && runId) {
		try {
			await prisma.generatedPlaylist.updateMany({
				where: {
					userId,
					inngestRunId: jobId ?? runId,
				},
				data: {
					inngestRunId: runId,
				},
			});
		} catch (error) {
			console.error('Failed to update playlist runId:', error);
		}
	}

	if ((status === 'Cancelled' || status === 'Failed') && userId) {
		try {
			await prisma.generatedPlaylist.updateMany({
				where: {
					userId,
					status: { not: status === 'Cancelled' ? 'cancelled' : 'failed' }, 
					inngestRunId: jobId ?? runId,
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
	if (userId) {
		try {
			lastPlaylist = await prisma.generatedPlaylist.findFirst({
				where: {
					userId,
					status: 'completed',
					...(jobId
						? {
								inngestRunId: jobId,
							}
						: {}),
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

