import prisma from '@/app/lib/prisma';

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const eventId = searchParams.get('eventId');
	const userId = searchParams.get('userId');

	if (!eventId) return Response.json({ error: 'No eventId' }, { status: 400 });

	const baseUrl =
		process.env.NODE_ENV === 'production'
			? 'https://api.inngest.com'
			: 'http://localhost:8288';

	const response = await fetch(`${baseUrl}/v1/events/${eventId}/runs`, {
		headers: {
			Authorization: `Bearer ${process.env.INNGEST_SIGNING_KEY}`,
		},
	});

	const json = await response.json();
	const run = json.data?.[0];

	const status = run?.status;
	const runId = run?.run_id;
	const output = run?.output;

	// Update the database with the runId and eventId if we have a userId
	if (userId && runId) {
		try {
			await prisma.generatedPlaylist.updateMany({
				where: {
					userId,
					inngestRunId: eventId, // Temporary jobId - update with actual runId
				},
				data: {
					inngestRunId: runId,
					inngestEventId: eventId,
				},
			});
		} catch (error) {
			console.error('Failed to update playlist runId:', error);
		}
	}

	// If cancelled, update the status in database
	if (status === 'cancelled' && userId) {
		try {
			await prisma.generatedPlaylist.updateMany({
				where: {
					userId,
					status: 'pending',
				},
				data: {
					status: 'cancelled',
				},
			});
		} catch (error) {
			console.error('Failed to update playlist status:', error);
		}
	}

	// Get the last generated playlist for this user
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
		status,
		output,
		runId,
		lastPlaylist: lastPlaylist ? {
			playlistLink: lastPlaylist.playlistLink,
			playlistName: lastPlaylist.playlistName,
			completedAt: lastPlaylist.completedAt,
		} : null,
	});
}
