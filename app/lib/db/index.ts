"use server";

import { SpotifyTrack, HistoryKind } from '@/app/types';
import { getCentroid } from '../utils';
import prisma from '../prisma';
import { Song } from '../../generated/prisma';
import { getDummyAccessToken } from '../spotify-dummy-auth';
import { getPlaylistDetails } from '../spotify';
import { setAccessToken } from '../spotifyApi';

export interface HistoryEntry {
	text: string;
	lastUsed: string;
	kind?: HistoryKind;
	sourcePlaylist?: {
		id: string;
		name: string;
		imageUrl?: string | null;
	};
	generatedPlaylists?: GeneratedPlaylistHistory[];
	[key: string]: any;
}

export type GeneratedPlaylistHistory = {
	playlistId: string | null;
	playlistName: string | null;
	playlistLink: string | null;
	completedAt: Date | null;
	createdAt: Date;
	status?: string;
	errorMessage?: string | null;
	retryCount?: number;
	id?: string;
	seeds?: SeedTrackHistory[] | null;
	event?: any;
};

export type SeedTrackHistory = {
	id?: string;
	name?: string;
	artist?: string[] | string;
	album?: string;
	image?: string;
};

export async function addUserHistory(
	userId: string,
	artists: string,
	sourcePlaylist?: { id: string; name: string },
): Promise<{ message: string; history: HistoryEntry[] }> {
	try {
		const lastUsed = new Date();
		const lastUsedString = lastUsed.toISOString();
		const entryText = sourcePlaylist?.id ?? artists;
		const newObject: HistoryEntry = {
			text: entryText,
			lastUsed: lastUsedString,
			...(sourcePlaylist ? { sourcePlaylist } : {}),
		};

		const result = await getUserHistory(userId);

		let currentHistory: HistoryEntry[] = result ? result : [];

		const artistExists = currentHistory.find(
			(entry: HistoryEntry) => entry.text === entryText,
		);

		if (artistExists) {
			const updatedHistory = currentHistory.map((entry: HistoryEntry) =>
				entry.text === entryText
					? { ...entry, ...newObject, lastUsed: lastUsedString }
					: entry,
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

		const userHistory = (history as unknown as HistoryEntry[]) ?? [];
		const getSourcePlaylistId = (entry: HistoryEntry) =>
			entry.sourcePlaylist?.id ?? (!entry.text.includes(',') ? entry.text : null);

		const sourcePlaylistIds = userHistory
			.map(getSourcePlaylistId)
			.filter((id): id is string => Boolean(id));

		if (sourcePlaylistIds.length === 0) return userHistory;

		const token = await getDummyAccessToken();
		setAccessToken(token);
		const sourcePlaylistDetails = await Promise.all(
			sourcePlaylistIds.map(async (id) => {
				const details = await getPlaylistDetails(id);
				if (!details || typeof details !== 'object' || 'message' in details) {
					return [id, null] as const;
				}
				return [
					id,
					details as { imageUrl?: string | null; totalTracks?: number | null },
				] as const;
			}),
		);
		const sourcePlaylistById = new Map(sourcePlaylistDetails);

		const generatedPlaylists = await prisma.generatedPlaylist.findMany({
			where: {
				userId,
				sourcePlaylistId: { in: sourcePlaylistIds },
				status: { in: ['pending', 'completed', 'failed', 'cancelled'] },
			},
			orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
			select: {
				id: true,
				sourcePlaylistId: true,
				playlistId: true,
				playlistName: true,
				playlistLink: true,
				completedAt: true,
				createdAt: true,
				status: true,
				seeds: true,
				errorMessage: true,
				retryCount: true,
				event: true,
			},
		});

		const playlistsBySource = generatedPlaylists.reduce(
			(acc, playlist) => {
				if (!playlist.sourcePlaylistId) return acc;
				const playlists = acc.get(playlist.sourcePlaylistId) ?? [];
				playlists.push({
					id: playlist.id,
					playlistId: playlist.playlistId,
					playlistName: playlist.playlistName,
					playlistLink: playlist.playlistLink,
					completedAt: playlist.completedAt,
					createdAt: playlist.createdAt,
					status: playlist.status,
					seeds: playlist.seeds as SeedTrackHistory[] | null,
					errorMessage: playlist.errorMessage,
					retryCount: playlist.retryCount,
					event: playlist.event as any,
				});
				acc.set(playlist.sourcePlaylistId, playlists);
				return acc;
			},
			new Map<string, GeneratedPlaylistHistory[]>(),
		);

		return userHistory
			.map((entry) => {
				const sourcePlaylistId = getSourcePlaylistId(entry) ?? '';
				const sourcePlaylistDetails = sourcePlaylistById.get(sourcePlaylistId);
				const generated = playlistsBySource.get(sourcePlaylistId) ?? [];

				const sortedGenerated = [...generated].sort((a, b) => {
					const statusRank = (status?: string) => {
						const normalized = status?.toLowerCase();
						if (normalized === 'completed') return 0;
						if (normalized === 'pending' || normalized === 'running')
							return 1;
						if (normalized === 'failed' || normalized === 'cancelled')
							return 2;
						return 3;
					};

					const statusDelta =
						statusRank(a.status) - statusRank(b.status);
					if (statusDelta !== 0) return statusDelta;

					const aTime =
						(a.completedAt ?? a.createdAt)?.getTime?.() ?? 0;
					const bTime =
						(b.completedAt ?? b.createdAt)?.getTime?.() ?? 0;
					return bTime - aTime;
				});

			const isArtistEntry = sortedGenerated.some((playlist: any) =>
				Boolean(
					playlist?.event?.data?.options?.artistName ??
						playlist?.event?.data?.artistName,
				),
			);

			const artistEvent = sortedGenerated.find((playlist: any) =>
				Boolean(
					playlist?.event?.data?.options?.artistName ??
						playlist?.event?.data?.artistName,
				),
			)?.event?.data;

			const artistImage = artistEvent?.artistImage;
			const artistName = artistEvent?.artistName;

			return {
				...entry,
				kind: (isArtistEntry ? 'artist' : 'playlist') as HistoryKind,
				sourcePlaylist: {
					...(entry.sourcePlaylist ?? { id: sourcePlaylistId, name: entry.text }),
					...(sourcePlaylistDetails?.imageUrl
						? { imageUrl: sourcePlaylistDetails.imageUrl }
						: {}),
					...(sourcePlaylistDetails?.totalTracks != null
						? { totalTracks: sourcePlaylistDetails.totalTracks }
						: {}),
				},
				generatedPlaylists: sortedGenerated,
			};
			})
			.sort((a, b) => {
				const aDate = new Date(a.lastUsed).getTime();
				const bDate = new Date(b.lastUsed).getTime();
				return bDate - aDate;
			});
	} catch (error) {
		console.error('Error fetching user history:', error);
		throw error;
	}
}

export async function getSong(
	spotifyId: string,
): Promise<(Song & { embedding: string | number[] | null }) | null> {
	const row = await prisma.$queryRawUnsafe<
		Array<Song & { embedding: string | number[] | null }>
	>(
		`SELECT id, title, artist, album, lyrics, summary, embedding::text AS embedding, "isComplete", "createdAt", "spotifyId", "youtubeId"
     FROM "Song"
     WHERE "spotifyId" = $1
     LIMIT 1`,
		spotifyId,
	);
	return row[0] ?? null;
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
			isComplete: true,
		},
	});
}

export async function updateSong(songId: string, lyrics: string) {
	const updated = await prisma.song.update({
		where: { id: songId },
		data: {
			lyrics,
			isComplete: true,
		},
	});
	return updated;
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
    SELECT embedding::text AS embedding FROM "Song"
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
