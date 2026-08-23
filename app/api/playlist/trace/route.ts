import { getCompletedPlaylistOutput } from '@/app/lib/inngest';
import { normalizeOutput } from '@/app/lib/utils';

export async function POST(req: Request) {
	let runId: unknown;
	try {
		const body = await req.json();
		runId = body?.runId;
	} catch {
		return Response.json({ error: 'Invalid request body' }, { status: 400 });
	}

	if (typeof runId !== 'string' || !runId) {
		return Response.json({ error: 'runId is required' }, { status: 400 });
	}

	try {
		const output = await getCompletedPlaylistOutput(runId);
		const normalized = output ? normalizeOutput(output) : null;
		return Response.json({ output: normalized ?? null });
	} catch (error) {
		console.error('[playlist/trace] trace lookup failed', {
			runId,
			error: error instanceof Error ? error.message : String(error),
		});
		return Response.json({ output: null });
	}
}
