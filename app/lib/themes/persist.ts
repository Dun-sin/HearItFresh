import { setDerivedThemes, setSongThemes } from '../db';
import { classifySongThemes, type ClassifiableSong } from './classify';
import { deriveThemes, DERIVE_VERSION, type JevAnswers } from './derive';
import { QUESTION_VERSIONS } from './questions';
import type { ThemeSlug } from './slugs';
import { isUpToDate, planSync, type VersionedRow } from './versions';

export type ClassifiableRow = ClassifiableSong &
	VersionedRow & {
		id: string;
		themes: string[];
	};

export async function syncSongThemes(
	row: ClassifiableRow,
	signal?: AbortSignal,
): Promise<ThemeSlug[] | null> {
	const plan = planSync(row);
	if (isUpToDate(plan)) return null;

	const storedRaw = (row.themesRaw as JevAnswers | null) ?? {};

	if (plan.rederive) {
		const themes = deriveThemes(storedRaw);
		await setDerivedThemes(row.id, themes, DERIVE_VERSION);
		return themes;
	}

	let raw: JevAnswers = { ...storedRaw };
	for (const id of plan.removed) delete raw[id];

	if (plan.stale.length > 0) {
		if (!row.lyrics) return null;

		const answers = await classifySongThemes(row, signal, plan.stale);
		if (!answers) return null;

		raw = { ...raw, ...answers };
	}

	const themes = deriveThemes(raw);
	await setSongThemes(row.id, themes, raw, QUESTION_VERSIONS, DERIVE_VERSION);

	return themes;
}
