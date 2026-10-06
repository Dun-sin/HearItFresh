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
