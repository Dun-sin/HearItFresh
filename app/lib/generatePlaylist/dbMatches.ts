import { findSimilarSongs } from '../db';
import { DB_SIMILAR_SONGS_LIMIT } from '../utils';
import type { ProviderName } from '../providers/types';
import { hasActiveThemeFilter } from '../themes/filter';
import { isInstrumental, paceOf } from '../pace/mix';
import { syncAudioFeatures } from '../pace/persist';
import { createPaceBudget } from '../pace/reccobeats';
import {
	CUTOFF,
	byRankDesc,
	keepInYearRange,
	keepMatchingThemes,
	parseEmbedding,
	scoreAgainstSeeds,
	titleKey,
	uniqueSongs,
	type RankedRef,
	type ScoringFilters,
} from './shared';
import type { PlaylistHistory } from './history';

export type DbMatch = RankedRef & { title: string };

async function scoreDbMatches(
	dbSimilar: any[],
	seedEmbeddings: number[][],
	provider: ProviderName,
	{
		signal,
		themeFilters,
		yearRange,
		paceBudget = createPaceBudget(),
	}: ScoringFilters,
): Promise<DbMatch[]> {
	const survivors = dbSimilar.flatMap((song: any) => {
		if (isInstrumental(song.title ?? '')) return [];

		const emb = parseEmbedding(song.embedding);
		if (!emb) return [];

		const scored = scoreAgainstSeeds(emb, seedEmbeddings);
		if (scored.maxScore < CUTOFF) return [];

		return [{ song, scored }];
	});

	const themed = hasActiveThemeFilter(themeFilters)
		? await keepMatchingThemes(survivors, themeFilters, signal)
		: survivors;

	const matches = await keepInYearRange(themed, yearRange, signal);

	const features = await syncAudioFeatures(
		matches.map(({ song }) => song),
		paceBudget,
		signal,
	);

	const ranked = matches
		.filter(({ song }) => !isInstrumental(song.title ?? '', features.get(song.id)))
		.map(({ song, scored }) => ({
			provider,
			externalId: song.externalId,
			title: song.title ?? '',
			artistName: song.artist ?? '',
			...scored,
			pace: paceOf(features.get(song.id)),
		}))
		.sort(byRankDesc);

	return uniqueSongs(
		ranked,
		(m) => m.title,
		(m) => m.artistName,
	);
}

export async function findDbMatches(
	seedEmbeddings: number[][],
	seedIds: string[],
	history: PlaylistHistory,
	provider: ProviderName,
	filters: ScoringFilters = {},
): Promise<DbMatch[]> {
	const excludeIds = [...seedIds, ...history.ids];
	const dbSimilar = await findSimilarSongs(
		seedEmbeddings,
		excludeIds,
		DB_SIMILAR_SONGS_LIMIT,
		provider,
	);

	const unheard = dbSimilar.filter(
		(song: any) =>
			!history.titles.has(titleKey(song.title ?? '', song.artist ?? '')),
	);

	return scoreDbMatches(unheard, seedEmbeddings, provider, filters);
}
