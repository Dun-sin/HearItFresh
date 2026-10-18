export const SEED_ROLES = ['expand', 'skipMain', 'skipAll'] as const;

export type SeedRole = (typeof SEED_ROLES)[number];

export const isSeedRole = (value: unknown): value is SeedRole =>
	SEED_ROLES.includes(value as SeedRole);

export function nextSeedRole(role: SeedRole, artistCount: number): SeedRole {
	if (artistCount <= 1) return role === 'expand' ? 'skipAll' : 'expand';
	return SEED_ROLES[(SEED_ROLES.indexOf(role) + 1) % SEED_ROLES.length];
}

export function relatedSourceArtists(seed: {
	artist: string[];
	role?: unknown;
}): string[] {
	if (seed.role === 'skipAll') return [];
	if (seed.role === 'skipMain') return seed.artist.slice(1);
	return seed.artist;
}
