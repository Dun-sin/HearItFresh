import {
	findSimilarSongs,
	getUserGeneratedSongIds,
	decodeGeneratedSongId,
} from '../db';
import { DB_SIMILAR_SONGS_LIMIT } from '../utils';
import type { ProviderName } from '../providers/types';
import { CUTOFF, parseEmbedding, scoreAgainstSeeds, type RankedRef } from './shared';

export type DbMatch = RankedRef & { title: string; artist: string };

function scoreDbMatches(
	dbSimilar: any[],
	seedEmbeddings: number[][],
	provider: ProviderName,
): DbMatch[] {
	return dbSimilar
		.map((song: any) => {
			const emb = parseEmbedding(song.embedding);
			if (!emb) return null;

			const scored = scoreAgainstSeeds(emb, seedEmbeddings);
			if (scored.maxScore < CUTOFF) return null;

			return {
				provider,
				externalId: song.externalId,
				title: song.title ?? '',
				artist: song.artist ?? '',
				...scored,
			};
		})
		.filter(Boolean) as DbMatch[];
}

export async function findDbMatches(
	seedEmbeddings: number[][],
	seedIds: string[],
	userId: string | undefined,
	provider: ProviderName,
): Promise<DbMatch[]> {
	let previouslyGeneratedIds: string[] = [];
	if (userId) {
		const raw = await getUserGeneratedSongIds(userId);
		previouslyGeneratedIds = raw
			.map((entry) => decodeGeneratedSongId(entry))
			.filter((d): d is { provider: ProviderName; externalId: string } => {
				if (!d) return false;
				// keep only ids that belong to the active provider's space,
				// restored to their bare external id.
				return d.provider === provider;
			})
			.map((d) => d.externalId);
	}

	const excludeIds = [...seedIds, ...previouslyGeneratedIds];
	const dbSimilar = await findSimilarSongs(
		seedEmbeddings,
		excludeIds,
		DB_SIMILAR_SONGS_LIMIT,
		provider,
	);

	return scoreDbMatches(dbSimilar, seedEmbeddings, provider);
}
