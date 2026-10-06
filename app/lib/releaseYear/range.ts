export type YearRange = { from?: number | null; to?: number | null };

const MIN_YEAR = 1900;

const validYear = (year: unknown): year is number =>
	typeof year === 'number' && Number.isInteger(year) && year >= MIN_YEAR;

export function normalizeYearRange(
	range?: YearRange | null,
): { from: number; to: number } | null {
	const from = validYear(range?.from) ? range.from : null;
	const to = validYear(range?.to) ? range.to : null;
	if (from === null && to === null) return null;

	const lower = from ?? MIN_YEAR;
	const upper = to ?? Number.MAX_SAFE_INTEGER;
	return lower <= upper ? { from: lower, to: upper } : { from: upper, to: lower };
}

export const hasYearRange = (range?: YearRange | null) =>
	normalizeYearRange(range) !== null;

export function inYearRange(
	year: number | null | undefined,
	range?: YearRange | null,
): boolean {
	const bounds = normalizeYearRange(range);
	if (!bounds) return true;
	return typeof year === 'number' && year >= bounds.from && year <= bounds.to;
}

export function yearFromReleaseDate(date?: string | null): number | undefined {
	const year = Number(date?.slice(0, 4));
	return validYear(year) ? year : undefined;
}
