import type { ThemeFilterState, ThemeFilters, ThemeSlug } from './slugs';

function slugsMarked(
	filters: ThemeFilters,
	state: ThemeFilterState,
): Set<ThemeSlug> {
	return new Set(
		Object.entries(filters)
			.filter(([, value]) => value === state)
			.map(([slug]) => slug as ThemeSlug),
	);
}

export function hasActiveThemeFilter(filters?: ThemeFilters): boolean {
	if (!filters) return false;
	return Object.values(filters).some((state) => state !== 'yes');
}

export function passesThemeFilter(
	themes: readonly string[] | null | undefined,
	filters?: ThemeFilters,
): boolean {
	if (!filters || !hasActiveThemeFilter(filters)) return true;

	const songThemes = themes ?? [];
	if (songThemes.length === 0) return true;

	const banned = slugsMarked(filters, 'hard_no');
	if (songThemes.some((theme) => banned.has(theme as ThemeSlug))) return false;

	const unwanted = slugsMarked(filters, 'no');
	return songThemes.some((theme) => !unwanted.has(theme as ThemeSlug));
}
