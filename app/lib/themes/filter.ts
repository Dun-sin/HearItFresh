import type { ThemeFilters, ThemeSlug } from './slugs';

function restrictedSlugs(filters: ThemeFilters): Set<ThemeSlug> {
	return new Set(
		Object.entries(filters)
			.filter(([, state]) => state === 'restrict')
			.map(([slug]) => slug as ThemeSlug),
	);
}

export function hasActiveThemeFilter(filters?: ThemeFilters): boolean {
	if (!filters) return false;
	return Object.values(filters).some((state) => state === 'restrict');
}

export function passesThemeFilter(
	themes: readonly string[] | null | undefined,
	filters?: ThemeFilters,
): boolean {
	if (!filters) return true;

	const restricted = restrictedSlugs(filters);
	if (restricted.size === 0) return true;

	return !(themes ?? []).some((theme) => restricted.has(theme as ThemeSlug));
}
