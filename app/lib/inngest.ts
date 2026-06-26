const getInngestBaseUrl = () => {
	return process.env.NODE_ENV === 'production'
		? 'https://api.inngest.com'
		: 'http://localhost:8288';
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

export const getInngestEventRuns = async (eventId: string) => {
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
	return json.data;
};
