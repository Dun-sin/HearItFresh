"use server";

import { SpotifyTrack } from '@/app/types';
import { getCentroid } from '../utils';
import prisma from '../prisma';

export interface HistoryEntry {
	text: string;
	lastUsed: string;
	[key: string]: any;
}

export async function addUserHistory(
	userId: string,
	artists: string,
): Promise<{ message: string; history: HistoryEntry[] }> {
	try {
		const lastUsed = new Date();
		const lastUsedString = lastUsed.toISOString();
		const newObject: HistoryEntry = { text: artists, lastUsed: lastUsedString };

		const result = await getUserHistory(userId);

		let currentHistory: HistoryEntry[] = result ? result : [];

		const artistExists = currentHistory.find(
			(entry: HistoryEntry) => entry.text === artists,
		);

		if (artistExists) {
			const updatedHistory = currentHistory.map((entry: HistoryEntry) =>
				entry.text === artists ? { ...entry, lastUsed: lastUsedString } : entry,
			);

			await prisma.user.update({
				where: { userId },
				data: {
					history: updatedHistory,
				},
			});
		} else {
			currentHistory = [...currentHistory, newObject];
			await prisma.user.update({
				where: { userId },
				data: { history: currentHistory },
			});
		}

		// Fetch the updated history from the database
		const updatedResult = await getUserHistory(userId);
		const updatedHistory: HistoryEntry[] = updatedResult ? updatedResult : [];

		return { message: 'success', history: updatedHistory };
	} catch (error) {
		console.error('Error updating history:', error);
		return { message: 'error', history: [] };
	}
}

export async function removeUserHistory(
	userId: string,
	artistToRemove: string,
): Promise<string> {
	try {
		const history = await getUserHistory(userId);
		const currentHistory: HistoryEntry[] = history ? history : [];

		const updatedHistory = currentHistory.filter(
			(entry: HistoryEntry) => entry.text !== artistToRemove,
		);

		await prisma.user.update({
			where: { userId },
			data: { history: updatedHistory },
		});

		console.log('History entry removed');
		return 'success';
	} catch (error) {
		console.error('Error removing history:', error);
		return 'error';
	}
}

export async function getUserHistory(
	userId: string,
): Promise<HistoryEntry[] | null | undefined> {
	try {
		const history = (await prisma.user.findUnique({ where: { userId } }))
			?.history;

		return history as unknown as HistoryEntry[];
	} catch (error) {
		console.error('Error fetching user history:', error);
		throw error;
	}
}

export async function getSong(spotifyId: string) {
	return await prisma.song.findUnique({ where: { spotifyId } });
}

export async function addSong(
	spotifyTrack: SpotifyTrack,
	lyrics: string,
	summary?: string | null,
) {
	return await prisma.song.create({
		data: {
			title: spotifyTrack.title,
			artist: spotifyTrack.artist,
			album: spotifyTrack.album,
			spotifyId: spotifyTrack.id,
			lyrics,
			summary,
		},
	});
}

export async function addEmbeddingToSong(songId: string, embedding: number[]) {
	return await prisma.$queryRawUnsafe(
		`UPDATE "Song" SET embedding = $1::vector WHERE id = $2 RETURNING id`,
		embedding,
		songId,
	);
}

export async function findSimilarSongs(
	seedEmbeddings: number[][],
	excludeSpotifyIds: string[],
	limit: number = 24,
): Promise<any[]> {
	if (seedEmbeddings.length === 0) return [];

	const centroid = getCentroid(seedEmbeddings);

	// 1. Build the safe exclusion list
	const safeExcludes = excludeSpotifyIds.filter((id) =>
		/^[a-zA-Z0-9]+$/.test(id),
	);
	const excludeClause =
		safeExcludes.length > 0
			? `AND "spotifyId" NOT IN (${safeExcludes
					.map((id) => `'${id}'`)
					.join(',')})`
			: '';

	// 2. Use Parameterized Query ($1) instead of string injection
	return await prisma.$queryRawUnsafe(
		`
    SELECT id, title, artist, album, "spotifyId",
           embedding <=> $1::vector AS distance
    FROM "Song"
    WHERE embedding IS NOT NULL
      AND "spotifyId" IS NOT NULL
      ${excludeClause}
    ORDER BY distance ASC
    LIMIT $2
  `,
		centroid, // Pass the raw number[] array as $1
		limit, // Pass the limit as $2
	);
}

export async function getSongEmbeddings(
	spotifyIds: string[],
): Promise<{ embedding: string | number[] }[]> {
	const safeIds = spotifyIds.filter((id) => /^[a-zA-Z0-9]+$/.test(id));
	if (safeIds.length === 0) return [];

	const list = safeIds.map((id) => `'${id}'`).join(',');
	return await prisma.$queryRawUnsafe(`
    SELECT embedding::text FROM "Song"
    WHERE "spotifyId" IN (${list}) AND embedding IS NOT NULL
  `);
}

export async function getUserGeneratedSongIds(userId: string): Promise<string[]> {
	try {
		const user = await prisma.user.findUnique({
			where: { userId },
			select: { generatedSongIds: true },
		});
		return user?.generatedSongIds ?? [];
	} catch (error) {
		console.error('Error fetching user generated songs:', error);
		return [];
	}
}

export async function addGeneratedSongsForUser(
	userId: string,
	spotifyIds: string[],
): Promise<void> {
	try {
		const existingIds = await getUserGeneratedSongIds(userId);
		const uniqueIds = [...new Set([...existingIds, ...spotifyIds])];
		await prisma.user.update({
			where: { userId },
			data: { generatedSongIds: uniqueIds },
		});
	} catch (error) {
		console.error('Error adding generated songs for user:', error);
	}
}