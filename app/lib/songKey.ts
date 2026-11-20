import { cleanMusicMetadata } from './utils';

// versions ("Acoustic", "Redux", "Sped Up") hang off " - " or brackets, so only the base title counts
const baseTitle = (title: string) =>
	cleanMusicMetadata(title)
		.split(' - ')[0]
		.replace(/\s*[([][^)\]]*[)\]]/g, '')
		.trim()
		.toLowerCase();

export const titleKey = (title: string, artist: string) =>
	baseTitle(title) + '|' + cleanMusicMetadata(artist).toLowerCase();

const VERSION_MARKER =
	/\b(?:live|acoustic|unplugged|stripped|demo|remix(?:ed)?|mix|edit|radio|instrumental|karaoke|a ?cappella|acapella|sped ?up|slowed|reverb|nightcore|8d|rework(?:ed)?|reimagined|redux|orchestral|symphonic|band|sessions?|rehearsal|commentary|mono|extended|tour|concert|version)\b/i;

const CANONICAL_VERSION = /\b(?:album|remaster(?:ed)?) version\b/gi;

const versionLabels = (title: string) => [
	...title.split(/ [-–—] /).slice(1),
	...Array.from(title.matchAll(/[([]([^)\]]*)[)\]]/g), (m) => m[1]),
];

export const isAlternateVersion = (title: string) =>
	versionLabels(title).some((label) =>
		VERSION_MARKER.test(label.replace(CANONICAL_VERSION, '')),
	);
