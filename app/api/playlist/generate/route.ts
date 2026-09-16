import { inngest } from '@/app/inngest/client';
import prisma from '@/app/lib/prisma';
import { isProviderName } from '@/app/lib/providers';

export async function POST(req: Request) {
	const {
		seeds,
		artistNames,
		options,
		userId,
		sourcePlaylistId,
		artistId,
		artistName,
		artistImage,
		provider,
		youtubeGuestCredentials,
		cancellationId,
	} = await req.json();

	const resolvedProvider = isProviderName(provider) ? provider : 'spotify';

	const isGuest = !userId;

	if (isGuest) {
		const { ids } = await inngest.send({
			name: 'playlist/generate',
			data: {
				seeds,
				artistNames,
				options,
				userId: null,
				sourcePlaylistId,
				artistId,
				artistName,
				artistImage,
				provider: resolvedProvider,
				generatedPlaylistId: null,
				persistResult: false,
				youtubeGuestCredentials,
				cancellationId,
			},
		});

		return Response.json({
			mode: 'guest',
			eventId: ids[0],
			generatedPlaylistId: null,
		});
	}

	let dbRecord: { id: string } | null = null;

	try {
		dbRecord = await prisma.generatedPlaylist.create({
			data: {
				userId,
				sourcePlaylistId,
				provider: resolvedProvider,
				status: 'pending',
				seeds,
			} as any,
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
			artistId,
			artistName,
			artistImage,
			provider: resolvedProvider,
			generatedPlaylistId: dbRecord.id,
			persistResult: true,
			cancellationId,
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

		return Response.json({ eventId: ids[0], generatedPlaylistId: dbRecord.id });
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
