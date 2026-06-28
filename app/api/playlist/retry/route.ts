import { inngest } from '@/app/inngest/client';
import prisma from '@/app/lib/prisma';
import { getInngestRunStatus } from '@/app/lib/inngest';

export async function POST(req: Request) {
	const { generatedPlaylistId } = await req.json();

	if (!generatedPlaylistId) {
		return Response.json(
			{ error: 'No generatedPlaylistId provided' },
			{ status: 400 },
		);
	}

	const record = await prisma.generatedPlaylist.findUnique({
		where: { id: generatedPlaylistId },
	});

	if (!record || record.status === 'completed') {
		return Response.json(
			{ error: 'Invalid or completed playlist record' },
			{ status: 400 },
		);
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

	const event = record.event as { name?: string; id?: string; data?: any } | null;

	if (!event?.name || !event?.data) {
		return Response.json(
			{ error: 'No event data found for retry' },
			{ status: 400 },
		);
	}

	const { ids } = await inngest.send({
		name: event.name,
		data: event.data,
	});

	await prisma.generatedPlaylist.update({
		where: { id: generatedPlaylistId },
		data: {
			status: 'pending',
			inngestRunId: null,
			event: {
				...event,
				id: ids[0],
			},
			retryCount: { increment: 1 },
		},
	});

	return Response.json({ generatedPlaylistId: record.id });
}

// TODO: add an option to see input used in playlist in frontend, so user can see what they used to generate the playlist
