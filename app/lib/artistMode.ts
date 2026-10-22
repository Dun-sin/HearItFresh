import { MIN_SEEDS } from './seedLimits';

export type ArtistModeStatus =
	| { kind: 'needsInput'; hasSongs: boolean }
	| { kind: 'loadPlaylist'; restrictedThemes: number }
	| { kind: 'needsSeeds'; missing: number; restrictedThemes: number }
	| { kind: 'ready'; seeds: number; restrictedThemes: number };

export function artistModeStatus({
	extractedCount,
	seedCount,
	hasPlaylistLink,
	restrictedThemes,
}: {
	extractedCount: number;
	seedCount: number;
	hasPlaylistLink: boolean;
	restrictedThemes: number;
}): ArtistModeStatus {
	if (seedCount >= MIN_SEEDS) {
		return { kind: 'ready', seeds: seedCount, restrictedThemes };
	}
	if (seedCount > 0) {
		return {
			kind: 'needsSeeds',
			missing: MIN_SEEDS - seedCount,
			restrictedThemes,
		};
	}
	if (extractedCount === 0 && hasPlaylistLink) {
		return { kind: 'loadPlaylist', restrictedThemes };
	}
	if (restrictedThemes > 0) {
		return { kind: 'ready', seeds: 0, restrictedThemes };
	}
	return { kind: 'needsInput', hasSongs: extractedCount > 0 };
}

export const canGenerateArtistPlaylist = (status: ArtistModeStatus) =>
	status.kind === 'ready' || status.kind === 'loadPlaylist';
