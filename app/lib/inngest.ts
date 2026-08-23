import { normalizeOutput, normalizeStatus } from './utils';

const getInngestBaseUrl = () => {
	return process.env.NODE_ENV === 'production'
		? 'https://api.inngest.com'
		: 'http://localhost:8288';
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

const TERMINAL_STATUSES: InngestRunStatus[] = [
	'Completed',
	'Failed',
	'Cancelled',
];
const ACTIVE_STATUSES: InngestRunStatus[] = ['Running', 'Scheduled', 'Pending'];

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
	const run = selectCurrentRun(await getInngestEventRuns(eventId));
	const runId = run?.run_id ?? run?.id;
	const status = normalizeStatus(run?.status);

	if (!runId) return run;
	if (run?.output) return run;

	const isTerminal = TERMINAL_STATUSES.includes(status as InngestRunStatus);
	if (!isTerminal) return run;

	return await getInngestRunStatus(runId);
};

export const getInngestRunStatus = async (runId: string) => {
	const baseUrl = getInngestBaseUrl();

	const response = await fetch(`${baseUrl}/v1/runs/${runId}`, {
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
	const baseUrl = getInngestBaseUrl();

	const response = await fetch(`${baseUrl}/v1/events/${eventId}/runs`, {
		headers: {
			Authorization: `Bearer ${process.env.INNGEST_SIGNING_KEY}`,
		},
	});

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

export async function getInngestRunTrace(runId: string) {
	const response = await fetch(
		`${getInngestBaseUrl()}/v1/runs/${runId}/trace?includeOutput=true`,
		{
			headers: {
				Authorization: `Bearer ${process.env.INNGEST_SIGNING_KEY}`,
			},
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch run trace: ${response.status}`);
	}

	const json = await response.json();
	return json.data;
}

function findFinalStepOutput(span: any): { link: string; name: string } | null {
	if (!span) return null;

	if (span.stepId === 'finalize-playlist-output') {
		return normalizeOutput(span.output);
	}

	for (const child of span.children ?? []) {
		const output: { link: string; name: string } | null =
			findFinalStepOutput(child);
		if (output) return output;
	}

	return null;
}

export async function getCompletedPlaylistOutput(
	runId: string,
	run?: InngestRun | null,
): Promise<{ link: string; name: string } | null> {
	const runOutput = normalizeOutput(run?.output);
	if (runOutput) return runOutput;

	const trace = await getInngestRunTrace(runId);
	return findFinalStepOutput(trace?.rootSpan);
}
