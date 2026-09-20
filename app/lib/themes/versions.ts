import { DERIVE_VERSION } from './derive';
import { QUESTION_VERSIONS, type QuestionVersions } from './questions';

export type VersionedRow = {
	themesRaw: unknown;
	themesQuestionVersions: unknown;
	themesDeriveVersion: number | null;
};

export type SyncPlan = {
	stale: string[];
	removed: string[];
	rederive: boolean;
};

const storedVersions = (row: VersionedRow): QuestionVersions =>
	(row.themesQuestionVersions as QuestionVersions | null) ?? {};

export function staleQuestionIds(row: VersionedRow): string[] {
	const stored = storedVersions(row);
	const answered = (row.themesRaw as Record<string, unknown> | null) ?? {};

	return Object.keys(QUESTION_VERSIONS).filter(
		(id) => stored[id] !== QUESTION_VERSIONS[id] || !(id in answered),
	);
}

export function removedQuestionIds(row: VersionedRow): string[] {
	return Object.keys(storedVersions(row)).filter(
		(id) => !(id in QUESTION_VERSIONS),
	);
}

export function planSync(row: VersionedRow): SyncPlan {
	const stale = staleQuestionIds(row);
	const removed = removedQuestionIds(row);
	const settled = stale.length === 0 && removed.length === 0;

	return {
		stale,
		removed,
		rederive:
			settled &&
			Boolean(row.themesRaw) &&
			row.themesDeriveVersion !== DERIVE_VERSION,
	};
}

export function isUpToDate({ stale, removed, rederive }: SyncPlan): boolean {
	return stale.length === 0 && removed.length === 0 && !rederive;
}

export function describeSync(plan: SyncPlan): string | null {
	if (isUpToDate(plan)) return null;
	if (plan.rederive) return 're-deriving from stored answers';

	return [
		plan.stale.length > 0 ? `asking ${plan.stale.length} question(s)` : null,
		plan.removed.length > 0
			? `dropping ${plan.removed.length} removed question(s)`
			: null,
	]
		.filter(Boolean)
		.join(', ');
}
