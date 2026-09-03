"use server";

import { SpotifyTrack, HistoryKind } from '@/app/types';
import type { ProviderName } from '../providers/types';
import { getCentroid } from '../utils';
import prisma from '../prisma';
import { Song } from '../../generated/prisma';
import { getProvider } from '../providers';


function idColumn(provider: ProviderName): 'spotifyId' | 'youtubeId' {
	return provider === 'youtube' ? 'youtubeId' : 'spotifyId';
}

/**
 * Guard for ids that get interpolated straight into the raw SQL below (the
 * vector queries can't parameterize these lists). Must allow `-` and `_`:
 * YouTube video ids are base64url, so roughly a third of them contain one,
 * and the old `[a-zA-Z0-9]`-only guard silently dropped those from every
 * embedding lookup — invisible on the Spotify path, whose ids are base62.
 * Still injection-safe: no quotes, semicolons, or backslashes get through.
 */
function isSafeExternalId(id: string): boolean {
	return /^[a-zA-Z0-9_-]+$/.test(id);
}


export const encodeGeneratedSongId = (
	provider: ProviderName,
	externalId: string,
) => `${provider}:${externalId}`;

export const decodeGeneratedSongId = (
	entry: string,
): { provider: ProviderName; externalId: string } | null => {
	const idx = entry.indexOf(':');
	if (idx <= 0) return null;
	const provider = entry.slice(0, idx);
	const externalId = entry.slice(idx + 1);
	if (provider !== 'spotify' && provider !== 'youtube') return null;
	return { provider, externalId };
};

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
	provider?: string | null;
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

		const sourcePlaylistDetails = await Promise.all(
			sourcePlaylistIds.map(async (id) => {
				const details = await getProvider('spotify').getPlaylistDetails(id);
				if (!details) {
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
				provider: true,
				completedAt: true,
				createdAt: true,
				status: true,
				seeds: true,
				errorMessage: true,
				retryCount: true,
				event: true,
			} as any,
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
					provider: (playlist as any).provider,
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
	externalId: string,
	provider: ProviderName = 'spotify',
): Promise<(Song & { embedding: string | number[] | null }) | null> {
	const col = idColumn(provider);
	const row = await prisma.$queryRawUnsafe<
		Array<Song & { embedding: string | number[] | null }>
	>(
		`SELECT id, title, artist, album, lyrics, summary, embedding::text AS embedding, "isComplete", "createdAt", "spotifyId", "youtubeId"
     FROM "Song"
     WHERE "${col}" = $1
     LIMIT 1`,
		externalId,
	);
	return row[0] ?? null;
}

export async function addSong(
	songInput: SpotifyTrack,
	lyrics: string,
	summary?: string | null,
	provider: ProviderName = 'spotify',
) {
	const col = idColumn(provider);
	const data: any = {
		title: songInput.title,
		artist: songInput.artist,
		album: songInput.album,
		lyrics,
		summary,
		isComplete: true,
	};
	data[col] = songInput.id;
	return await prisma.song.create({ data });
}

export async function getCachedYoutubeIds(
	spotifyIds: string[],
): Promise<Map<string, string>> {
	const safeIds = spotifyIds.filter((id) => isSafeExternalId(id));
	if (safeIds.length === 0) return new Map();

	const rows = await prisma.song.findMany({
		where: { spotifyId: { in: safeIds }, youtubeId: { not: null } },
		select: { spotifyId: true, youtubeId: true },
	});

	return new Map(
		rows
			.filter((r) => r.spotifyId && r.youtubeId)
			.map((r) => [r.spotifyId as string, r.youtubeId as string]),
	);
}

/** Of the given video ids, the ones no Song row has claimed yet. */
export async function filterUnclaimedYoutubeIds(
	youtubeIds: string[],
): Promise<Set<string>> {
	const safeIds = youtubeIds.filter((id) => isSafeExternalId(id));
	if (safeIds.length === 0) return new Set();

	const taken = await prisma.song.findMany({
		where: { youtubeId: { in: safeIds } },
		select: { youtubeId: true },
	});

	const takenIds = new Set(taken.map((r) => r.youtubeId));
	return new Set(safeIds.filter((id) => !takenIds.has(id)));
}

export async function cacheYoutubeIdForSpotifyId(
	spotifyId: string,
	youtubeId: string,
): Promise<void> {
	try {
		await prisma.song.updateMany({
			where: { spotifyId, youtubeId: null },
			data: { youtubeId },
		});
	} catch (e: any) {
		if (e?.code === 'P2002') {
			console.log(
				`youtubeId ${youtubeId} is already cached for another song; skipping for ${spotifyId}`,
			);
			return;
		}
		console.error('Failed to cache youtubeId for song', spotifyId, e);
	}
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
	excludeIds: string[],
	limit: number = 24,
	provider: ProviderName = 'spotify',
): Promise<any[]> {
	if (seedEmbeddings.length === 0) return [];

	const col = idColumn(provider);
	const centroid = getCentroid(seedEmbeddings);

	// 1. Build the safe exclusion list
	const safeExcludes = excludeIds.filter((id) => isSafeExternalId(id));
	const excludeClause =
		safeExcludes.length > 0
			? `AND "${col}" NOT IN (${safeExcludes.map((id) => `'${id}'`).join(',')})`
			: '';

	// 2. Use Parameterized Query ($1) instead of string injection
	return await prisma.$queryRawUnsafe(
		`
    SELECT id, title, artist, album, "${col}" AS "externalId",
           embedding <=> $1::vector AS distance
    FROM "Song"
    WHERE embedding IS NOT NULL
      AND "${col}" IS NOT NULL
      ${excludeClause}
    ORDER BY distance ASC
    LIMIT $2
  `,
		centroid, // Pass the raw number[] array as $1
		limit, // Pass the limit as $2
	);
}

export async function getSongEmbeddings(
	ids: string[],
	provider: ProviderName = 'spotify',
): Promise<{ embedding: string | number[] }[]> {
	const col = idColumn(provider);
	const safeIds = ids.filter((id) => isSafeExternalId(id));
	if (safeIds.length === 0) return [];

	const list = safeIds.map((id) => `'${id}'`).join(',');
	return await prisma.$queryRawUnsafe(`
    SELECT embedding::text AS embedding FROM "Song"
    WHERE "${col}" IN (${list}) AND embedding IS NOT NULL
  `);
}

export async function getUserGeneratedSongIds(
	userId: string,
): Promise<string[]> {
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

export async function findYoutubeConnection(userId: string) {
	return prisma.youtubeConnection.findUnique({ where: { userId } });
}

export async function saveYoutubeConnection(params: {
	userId: string;
	accessToken: string;
	refreshToken: string;
	expiresAt: Date;
	scope?: string | null;
}) {
	const { userId, ...data } = params;
	return prisma.youtubeConnection.upsert({
		where: { userId },
		create: { userId, ...data, scope: data.scope ?? null },
		update: { ...data, scope: data.scope ?? null },
	});
}

export async function updateYoutubeConnectionTokens(
	userId: string,
	data: { accessToken: string; refreshToken: string; expiresAt: Date },
) {
	return prisma.youtubeConnection.update({ where: { userId }, data });
}

export async function removeYoutubeConnection(userId: string) {
	await prisma.youtubeConnection.deleteMany({ where: { userId } });
}

// TODO: callers run this during track selection, before the playlist is
// actually created — a failed/cancelled run still burns these songs from the
// user's future recommendations. Move it after add-tracks-to-playlist succeeds.
export async function addGeneratedSongsForUser(
	userId: string,
	ids: string[],
	provider: ProviderName = 'spotify',
): Promise<void> {
	try {
		const existingIds = await getUserGeneratedSongIds(userId);
		const encoded = ids.map((id) => encodeGeneratedSongId(provider, id));
		const uniqueIds = [...new Set([...existingIds, ...encoded])];
		await prisma.user.update({
			where: { userId },
			data: { generatedSongIds: uniqueIds },
		});
	} catch (error) {
		console.error('Error adding generated songs for user:', error);
	}
}
