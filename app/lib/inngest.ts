import {
	normalizeOutput,
	normalizeStatus,
	PlaylistOutput,
} from './utils';

const getInngestV2BaseUrl = () => {
	return process.env.NODE_ENV === 'production'
		? 'https://api.inngest.com/v2'
		: 'http://localhost:8288/api/v2';
};

export type InngestRunStatus =
	| 'Pending'
	| 'Running'
	| 'Scheduled'
	| 'Completed'
	| 'Cancelled'
	| 'Failed';

export type InngestRun = {
	run_id?: string;
	id?: string;
	status?: string;
	output?: unknown;
	[key: string]: unknown;
};

export type NormalizedInngestRun = {
	runId: string | null;
	status: InngestRunStatus | null;
	output: PlaylistOutput | null;
	raw: InngestRun;
};

const TERMINAL_STATUSES: InngestRunStatus[] = [
	'Completed',
	'Failed',
	'Cancelled',
];
const ACTIVE_STATUSES: InngestRunStatus[] = ['Running', 'Scheduled', 'Pending'];

/**
 * Normalizes the v2 API run object into the app's canonical shape at the
 * adapter boundary so callers never re-implement status/output mapping.
 */
export function normalizeRun(
	run: InngestRun | null | undefined,
): NormalizedInngestRun {
	if (!run) {
		return { runId: null, status: null, output: null, raw: {} };
	}

	const runId = run.run_id ?? run.id ?? null;
	const status = (normalizeStatus(run.status) as InngestRunStatus) ?? null;
	const output = normalizeOutput(run.output);

	return { runId, status, output, raw: run };
}

export function selectCurrentRun(runs: InngestRun[]): InngestRun | null {
	if (!runs || runs.length === 0) return null;

	const terminalRun = runs.find((run) => {
		const status = normalizeStatus(run.status);
		return TERMINAL_STATUSES.includes(status as InngestRunStatus);
	});

	const activeRun = runs.find((run) => {
		const status = normalizeStatus(run.status);
		return ACTIVE_STATUSES.includes(status as InngestRunStatus);
	});

	return terminalRun ?? activeRun ?? runs[0] ?? null;
}

export const getCurrentRunForEvent = async (
	eventId: string,
): Promise<InngestRun | null> => {
	const runs = await getInngestEventRuns(eventId);
	const run = selectCurrentRun(runs);
	const runId = run?.run_id ?? run?.id;
	const status = normalizeStatus(run?.status);

	if (!runId) return run;
	if (run?.output) return run;

	const isTerminal = TERMINAL_STATUSES.includes(status as InngestRunStatus);
	if (!isTerminal) return run;

	return await getInngestRunStatus(runId);
};

export const getInngestRunStatus = async (runId: string) => {
	const baseUrl = getInngestV2BaseUrl();

	const response = await fetch(`${baseUrl}/runs/${runId}`, {
		headers: {
			Authorization: `Bearer ${process.env.INNGEST_SIGNING_KEY}`,
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch run status: ${response.status}`);
	}

	const json = await response.json();
	return json.data;
};

export const getInngestEventRuns = async (
	eventId: string,
): Promise<InngestRun[]> => {
	const baseUrl = getInngestV2BaseUrl();

	const response = await fetch(
		`${baseUrl}/events/${eventId}/runs?includeOutput=true`,
		{
			headers: {
				Authorization: `Bearer ${process.env.INNGEST_SIGNING_KEY}`,
			},
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch event runs: ${response.status}`);
	}

	const json = await response.json();

	if (Array.isArray(json.data)) {
		return json.data as InngestRun[];
	}

	if (Array.isArray(json.data?.runs)) {
		return json.data.runs as InngestRun[];
	}

	if (Array.isArray(json.runs)) {
		return json.runs as InngestRun[];
	}

	return [];
};
