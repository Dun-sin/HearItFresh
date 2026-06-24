import { inngest } from '@/app/inngest/client';
import prisma from '@/app/lib/prisma';
import { getInngestRunStatus } from '@/app/lib/inngest';

export async function POST(req: Request) {
	const { playlistDbId } = await req.json();

	if (!playlistDbId) {
		return Response.json(
			{ error: 'No playlistDbId provided' },
			{ status: 400 },
		);
	}

	const record = await prisma.generatedPlaylist.findUnique({
		where: { id: playlistDbId },
	});

	if (!record || record.status === 'completed') {
		return Response.json(
			{ error: 'Invalid or completed playlist record' },
			{ status: 400 },
		);
	}

	const existingPendingRecords = await prisma.generatedPlaylist.findMany({
		where: {
			userId: record.userId,
			status: 'pending',
			NOT: {
				id: playlistDbId,
			},
		},
	});

	for (const pendingRecord of existingPendingRecords) {
		if (pendingRecord.inngestRunId) {
			try {
				const run = await getInngestRunStatus(pendingRecord.inngestRunId);
				if (run && run.status === 'Running') {
					return Response.json(
						{
							error:
								'A playlist generation is already in progress. Please wait for it to complete.',
						},
						{ status: 400 },
					);
				}
			} catch (error) {
				console.error('Error checking Inngest run status:', error);
			}
		}
	}

	if (record.inngestRunId) {
		try {
			const run = await getInngestRunStatus(record.inngestRunId);
			if (run && run.status === 'Running') {
				return Response.json(
					{
						error:
							'A playlist generation is already in progress. Please wait for it to complete.',
					},
					{ status: 400 },
				);
			}
		} catch (error) {
			console.error('Error checking Inngest run status:', error);
		}
	}

	const event = record.event as { name: string; id: string; data: any } | null;

	if (event) {
		await inngest.send({
			name: event.name,
			data: event.data,
		});
	} else {
		const seeds = record.seeds as any[] | undefined;
		const artistNames = seeds?.map((s) => s.artist).flat() ?? [];
		const eventData = {
			seeds,
			artistNames,
			options: {},
			userId: record.userId,
			sourcePlaylistId: record.sourcePlaylistId,
			generatedPlaylistId: playlistDbId,
		};

		await inngest.send({
			name: 'playlist/generate',
			data: eventData,
		});
	}

	await prisma.generatedPlaylist.update({
		where: { id: playlistDbId },
		data: {
			status: 'pending',
		},
	});

	return Response.json({ playlistDbId: record.id });
}

// TODO: add an option to see input used in playlist in frontend, so user can see what they used to generate the playlist
