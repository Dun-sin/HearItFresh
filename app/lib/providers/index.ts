import type { MusicProvider, ProviderName } from './types';
import { spotifyProvider } from './spotify';
import { youtubeProvider } from './youtube';

const providers: Record<ProviderName, MusicProvider> = {
	spotify: spotifyProvider,
	youtube: youtubeProvider,
};

export function getProvider(name: ProviderName): MusicProvider {
	return providers[name];
}

export function isProviderName(value: unknown): value is ProviderName {
	return value === 'spotify' || value === 'youtube';
}
