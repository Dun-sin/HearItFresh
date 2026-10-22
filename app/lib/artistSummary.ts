export type ArtistMatchSummary = {
	artistName: string;
	considered: number;
	alreadyHeard: number;
	matched: number;
};

const isCount = (value: unknown): value is number =>
	typeof value === 'number' && Number.isInteger(value) && value >= 0;

export function parseArtistSummary(value: unknown): ArtistMatchSummary | null {
	if (!value || typeof value !== 'object') return null;

	const { artistName, considered, alreadyHeard, matched } = value as Record<
		string,
		unknown
	>;

	if (
		typeof artistName !== 'string' ||
		!isCount(considered) ||
		!isCount(alreadyHeard) ||
		!isCount(matched)
	) {
		return null;
	}

	return { artistName, considered, alreadyHeard, matched };
}

export function describeArtistSummary({
	artistName,
	considered,
	alreadyHeard,
	matched,
}: ArtistMatchSummary): string {
	const songs = `${considered} ${artistName} ${considered === 1 ? 'song' : 'songs'}`;
	const pool = alreadyHeard > 0 ? `the ${songs} you haven't heard` : songs;

	return `Out of ${pool}, ${matched} fit what you asked for.`;
}
