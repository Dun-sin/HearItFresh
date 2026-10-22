import type { GenerationOptions } from '@/app/types';
import { hasActiveThemeFilter } from '../themes/filter';
import { isThemeSlug, type ThemeFilters } from '../themes/slugs';
import { isSeedRole } from '../seedRoles';
import { MAX_SEEDS, MIN_SEEDS } from '../seedLimits';
import type { SeedInput } from './shared';

export const NO_SEEDS_OR_THEMES_ERROR = `Pick ${MIN_SEEDS} to ${MAX_SEEDS} seed songs or switch off at least one theme to build an artist playlist.`;

export type GenerationRequest = {
	seeds: SeedInput[];
	options: GenerationOptions;
	artist: { id: string; name: string } | null;
};

type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

const fail = (error: string): { ok: false; error: string } => ({
	ok: false,
	error,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
	typeof value === 'string' && value.trim().length > 0;

const isAbsent = (value: unknown) => value === undefined || value === null;

function isSeed(value: unknown): value is SeedInput {
	if (!isRecord(value)) return false;

	const { id, name, artist, album, role } = value;
	return (
		isNonEmptyString(id) &&
		typeof name === 'string' &&
		Array.isArray(artist) &&
		artist.every((a) => typeof a === 'string') &&
		(isAbsent(album) || typeof album === 'string') &&
		(isAbsent(role) || isSeedRole(role))
	);
}

function parseThemeFilters(value: unknown): Validated<ThemeFilters> {
	if (isAbsent(value)) return { ok: true, value: {} };
	if (!isRecord(value)) return fail('options.themeFilters must be an object.');

	const unknownThemes = Object.keys(value).filter((key) => !isThemeSlug(key));
	if (unknownThemes.length > 0) {
		return fail(`Unknown themes: ${unknownThemes.join(', ')}.`);
	}

	const badStates = Object.entries(value)
		.filter(([, state]) => state !== 'neutral' && state !== 'restrict')
		.map(([theme]) => theme);
	if (badStates.length > 0) {
		return fail(
			`Themes must be "neutral" or "restrict": ${badStates.join(', ')}.`,
		);
	}

	return { ok: true, value: value as ThemeFilters };
}

export function validateGenerationRequest(
	body: unknown,
): Validated<GenerationRequest> {
	if (!isRecord(body)) return fail('Request body must be a JSON object.');

	const { seeds = [], options = {}, artistId, artistName } = body;

	if (!Array.isArray(seeds) || !seeds.every(isSeed)) {
		return fail('seeds must be a list of songs, each with an id, name and artist list.');
	}
	if (!isRecord(options)) return fail('options must be an object.');

	const themeFilters = parseThemeFilters(options.themeFilters);
	if (!themeFilters.ok) return themeFilters;

	let artist: GenerationRequest['artist'] = null;
	if (!isAbsent(artistId)) {
		if (!isNonEmptyString(artistId) || !isNonEmptyString(artistName)) {
			return fail('artistId and artistName must both be non-empty strings.');
		}
		artist = { id: artistId, name: artistName };
	}

	const themesOnly = artist !== null && seeds.length === 0;

	if (themesOnly && !hasActiveThemeFilter(themeFilters.value)) {
		return fail(NO_SEEDS_OR_THEMES_ERROR);
	}
	if (!themesOnly && (seeds.length < MIN_SEEDS || seeds.length > MAX_SEEDS)) {
		return fail(
			artist
				? NO_SEEDS_OR_THEMES_ERROR
				: `Pick ${MIN_SEEDS} to ${MAX_SEEDS} seed songs.`,
		);
	}

	return {
		ok: true,
		value: {
			seeds,
			options: {
				...options,
				themeFilters: themeFilters.value,
			} as GenerationOptions,
			artist,
		},
	};
}
