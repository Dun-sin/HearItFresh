import {
	findSimilarSongs,
	getUserGeneratedSongIds,
	decodeGeneratedSongId,
} from '../db';
import { DB_SIMILAR_SONGS_LIMIT } from '../utils';
import type { ProviderName } from '../providers/types';
import { hasActiveThemeFilter } from '../themes/filter';
import type { ThemeFilters } from '../themes/slugs';
import { syncSongPaces } from '../pace/persist';
import { createPaceBudget, type PaceBudget } from '../pace/reccobeats';
import {
	CUTOFF,
	keepMatchingThemes,
	parseEmbedding,
	scoreAgainstSeeds,
	type RankedRef,
} from './shared';

export type DbMatch = RankedRef & { title: string; artist: string };

async function scoreDbMatches(
	dbSimilar: any[],
	seedEmbeddings: number[][],
	provider: ProviderName,
	themeFilters: ThemeFilters | undefined,
	paceBudget: PaceBudget,
	signal?: AbortSignal,
): Promise<DbMatch[]> {
	const survivors = dbSimilar.flatMap((song: any) => {
		const emb = parseEmbedding(song.embedding);
		if (!emb) return [];

		const scored = scoreAgainstSeeds(emb, seedEmbeddings);
		if (scored.maxScore < CUTOFF) return [];

		return [{ song, scored }];
	});

	const matches = hasActiveThemeFilter(themeFilters)
		? await keepMatchingThemes(survivors, themeFilters, signal)
		: survivors;

	const paces = await syncSongPaces(
		matches.map(({ song }) => song),
		paceBudget,
		signal,
	);

	return matches.map(({ song, scored }) => ({
		provider,
		externalId: song.externalId,
		title: song.title ?? '',
		artist: song.artist ?? '',
		...scored,
		pace: paces.get(song.id) ?? null,
	}));
}

export async function findDbMatches(
	seedEmbeddings: number[][],
	seedIds: string[],
	userId: string | undefined,
	provider: ProviderName,
	themeFilters?: ThemeFilters,
	signal?: AbortSignal,
	paceBudget: PaceBudget = createPaceBudget(),
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

	return scoreDbMatches(
		dbSimilar,
		seedEmbeddings,
		provider,
		themeFilters,
		paceBudget,
		signal,
	);
}
