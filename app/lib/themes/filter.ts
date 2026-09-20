import type { ThemeFilters, ThemeSlug } from './slugs';

function excludedSlugs(filters: ThemeFilters): ThemeSlug[] {
	return Object.entries(filters)
		.filter(([, state]) => state === 'no')
		.map(([slug]) => slug as ThemeSlug);
}

export function hasActiveThemeFilter(filters?: ThemeFilters): boolean {
	if (!filters) return false;
	return Object.values(filters).some((state) => state === 'no');
}

export function passesThemeFilter(
	themes: readonly string[] | null | undefined,
	filters?: ThemeFilters,
): boolean {
	if (!filters) return true;

	const excluded = excludedSlugs(filters);
	if (excluded.length === 0) return true;

	const songThemes = new Set(themes ?? []);
	return !excluded.some((slug) => songThemes.has(slug));
}
