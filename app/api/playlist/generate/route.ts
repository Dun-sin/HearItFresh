import { inngest } from '@/app/inngest/client';
import prisma from '@/app/lib/prisma';
import { isProviderName } from '@/app/lib/providers';
import { validateGenerationRequest } from '@/app/lib/generatePlaylist/validate';

export async function POST(req: Request) {
	let body: any;
	try {
		body = await req.json();
	} catch {
		return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
	}

	const request = validateGenerationRequest(body);
	if (!request.ok) {
		return Response.json({ error: request.error }, { status: 400 });
	}

	const { seeds, options } = request.value;
	const artistId = request.value.artist?.id;
	const artistName = request.value.artist?.name;
	const {
		userId,
		sourcePlaylistId,
		artistImage,
		provider,
		youtubeGuestCredentials,
		cancellationId,
	} = body;

	const resolvedProvider = isProviderName(provider) ? provider : 'spotify';

	const isGuest = !userId;

	if (isGuest) {
		const { ids } = await inngest.send({
			name: 'playlist/generate',
			data: {
				seeds,
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
