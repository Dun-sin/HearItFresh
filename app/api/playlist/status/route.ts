import prisma from '@/app/lib/prisma';
import { getInngestRunStatus } from '@/app/lib/inngest';
import {
	formatPlaylistOutput,
	normalizeOutput,
	normalizeStatus,
} from '@/app/lib/utils';

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const userId = searchParams.get('userId');
	const generatedPlaylistId = searchParams.get('generatedPlaylistId');

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
		const status = normalizeStatus(run?.status);
		const output = normalizeOutput(run?.output);

		return Response.json({
			status,
			output: output ?? formatPlaylistOutput(record),
			runId: record.inngestRunId,
			lastPlaylist: formatPlaylistOutput(record),
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
		output: formatPlaylistOutput(record) ?? formatPlaylistOutput(lastPlaylist),
		runId: null,
		lastPlaylist: formatPlaylistOutput(lastPlaylist),
	});
}
