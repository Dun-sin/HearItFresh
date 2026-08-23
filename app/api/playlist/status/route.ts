import prisma from '@/app/lib/prisma';
import {
	getInngestRunStatus,
	getCurrentRunForEvent,
	normalizeRun,
} from '@/app/lib/inngest';
import { formatPlaylistOutput } from '@/app/lib/helpers';

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const userId = searchParams.get('userId');
	const generatedPlaylistId = searchParams.get('generatedPlaylistId');
	const eventId = searchParams.get('eventId');
	const runId = searchParams.get('runId');

	// Guest: once the client learns the concrete run identity, poll that run directly
	if (runId && !generatedPlaylistId) {
		try {
			const run = await getInngestRunStatus(runId);
			const { status, output, runId: resolvedRunId } = normalizeRun(run);

			return Response.json({
				status,
				output,
				runId: resolvedRunId ?? runId,
				lastPlaylist: output,
			});
		} catch (error) {
			console.error('[playlist/status] run lookup failed', error);
			return Response.json(
				{ error: 'Failed to fetch run status' },
				{ status: 500 },
			);
		}
	}

	// Guest: bootstrap lookup that resolves the event to its current run. The
	// returned `runId` lets the client switch to run-based polling.
	if (eventId && !generatedPlaylistId) {
		try {
			const run = await getCurrentRunForEvent(eventId);
			const { status, output, runId: resolvedRunId } = normalizeRun(run);

			return Response.json({
				status: status ?? 'Pending',
				output,
				runId: resolvedRunId ?? null,
				lastPlaylist: output,
			});
		} catch (error) {
			console.error('[playlist/status] guest lookup failed', error);
			return Response.json(
				{ error: 'Failed to fetch guest run status' },
				{ status: 500 },
			);
		}
	}

	if (!generatedPlaylistId) {
		return Response.json({ error: 'No generatedPlaylistId' }, { status: 400 });
	}

	const record = await prisma.generatedPlaylist.findUnique({
		where: { id: generatedPlaylistId },
	});

	if (!record) {
		return Response.json(
			{ error: 'Playlist record not found' },
			{ status: 404 },
		);
	}

	if (record.inngestRunId) {
		const run = await getInngestRunStatus(record.inngestRunId);
		const { status, output } = normalizeRun(run);
		const persistedOutput = formatPlaylistOutput(record);

		return Response.json({
			status,
			output,
			runId: record.inngestRunId,
			lastPlaylist: persistedOutput,
		});
	}

	let lastPlaylist = null;
	if (userId) {
		try {
			lastPlaylist = await prisma.generatedPlaylist.findFirst({
				where: {
					userId,
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
		status: 'Pending',
		output: null,
		runId: null,
		lastPlaylist:
			formatPlaylistOutput(record) ?? formatPlaylistOutput(lastPlaylist),
	});
}
