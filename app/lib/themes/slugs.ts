export const LOVE_THEME_SLUGS = [
	'love_gendered',
	'love_earnest',
	'love_yearning',
	'love_betrayal',
	'love_playful',
	'love_obsessive',
	'love_bittersweet',
] as const;

export const GENERAL_THEME_SLUGS = [
	'grief',
	'sexual_explicit',
	'substance_use',
	'self_reflection',
	'celebration',
	'social_political',
	'platonic',
	'metaphoric',
	'nostalgia',
	'mental_health',
	'defiant',
] as const;

export const THEME_SLUGS = [
	...LOVE_THEME_SLUGS,
	...GENERAL_THEME_SLUGS,
] as const;

export type ThemeSlug = (typeof THEME_SLUGS)[number];

export type ThemeFilterState = 'neutral' | 'restrict';

export type ThemeFilters = Partial<Record<ThemeSlug, ThemeFilterState>>;

export const DEFAULT_THEME_FILTER_STATE: ThemeFilterState = 'neutral';

export const THEME_LABELS: Record<ThemeSlug, string> = {
	love_gendered: 'Gendered partner',
	love_earnest: 'Earnest / devotional',
	love_yearning: 'Yearning / unresolved',
	love_betrayal: 'Betrayal / breakup',
	love_playful: 'Playful / flirtatious',
	love_obsessive: 'Obsessive / intense',
	love_bittersweet: 'Bittersweet / conflicted',
	grief: 'Grief / loss',
	sexual_explicit: 'Sexually explicit',
	substance_use: 'Substance use',
	self_reflection: 'Self reflection',
	celebration: 'Celebration / hype',
	social_political: 'Social / political',
	platonic: 'Friendship / family',
	metaphoric: 'Metaphoric / symbolic',
	nostalgia: 'Nostalgia / memory',
	mental_health: 'Mental health',
	defiant: 'Defiant / empowered',
};

export function isThemeSlug(value: string): value is ThemeSlug {
	return (THEME_SLUGS as readonly string[]).includes(value);
}
