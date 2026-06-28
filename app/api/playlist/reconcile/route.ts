import prisma from '@/app/lib/prisma';
import { getInngestRunStatus, getInngestEventRuns } from '@/app/lib/inngest';
import { normalizeStatus, normalizeOutput } from '@/app/lib/utils';

type ReconcileResponse = {
	status?:
		| 'Pending'
		| 'Running'
		| 'Scheduled'
		| 'Completed'
		| 'Cancelled'
		| 'Failed';
	active?: {
		generatedPlaylistId: string;
		status: 'Pending' | 'Running' | 'Scheduled';
	};
	updated?: Array<{
		generatedPlaylistId: string;
		status: 'Completed' | 'Cancelled' | 'Failed';
		output?: { link: string; name: string } | null;
		errorMessage?: string | null;
	}>;
};

export async function POST(req: Request) {
	const { userId, generatedPlaylistId } = await req.json();

	if (!userId) {
		return Response.json({ error: 'userId is required' }, { status: 400 });
	}

	const whereClause = generatedPlaylistId
		? { id: generatedPlaylistId, userId }
		: { userId, status: 'pending' };

	const records = await prisma.generatedPlaylist.findMany({
		where: whereClause,
		orderBy: { createdAt: 'desc' },
	});

	if (records.length === 0) {
		return Response.json({} as ReconcileResponse);
	}

	const response: ReconcileResponse = {};
	const updated: ReconcileResponse['updated'] = [];

	for (const record of records) {
		let runId = record.inngestRunId;
		let run: any = null;

    if (runId) {
      try {
        run = await getInngestRunStatus(runId);
      } catch (e) {
        console.error('Error fetching run status:', e);
      }
		} else if (record.event) {
			const event = record.event as { id?: string };
			if (!event.id) {
				continue;
			}

      try {
        const eventRuns = await getInngestEventRuns(event.id);
        if (eventRuns?.runs?.length > 0) {
          const newestRun = eventRuns.runs[eventRuns.runs.length - 1];
          runId = newestRun.id;
          run = newestRun;
          await prisma.generatedPlaylist.update({
            where: { id: record.id },
            data: { inngestRunId: runId },
          });
        }
      } catch (e) {
        console.error('Error fetching event runs:', e);
			}
		}

		if (!run) {
			continue;
		}

    const status = normalizeStatus(run?.status);

		if (
			status === 'Running' ||
			status === 'Scheduled' ||
			status === 'Pending'
		) {
			response.status = status as 'Pending' | 'Running' | 'Scheduled';
			response.active = {
				generatedPlaylistId: record.id,
				status: status as 'Pending' | 'Running' | 'Scheduled',
			};
			continue;
		}

		const output = normalizeOutput(run?.output);

		// if the status is Completed, Cancelled, or Failed, we need to update the record in the database and add it to the updated array
		if (status === 'Completed') {
			if (!output?.link || !output?.name) {
				continue;
			}

      await applyTerminalState(record, 'Completed', updated, {
        output,
      });
    } else if (status === 'Cancelled') {
      await applyTerminalState(record, 'Cancelled', updated, {
        errorMessage: 'Generation was cancelled',
      });
    } else if (status === 'Failed') {
      await applyTerminalState(record, 'Failed', updated, {
        errorMessage: run?.errorMessage || 'Generation failed',
      });
    }
  }

	if (updated.length > 0) {
		response.updated = updated;
	}

	return Response.json(response);
}

async function applyTerminalState(
	record: { id: string },
	status: 'Completed' | 'Cancelled' | 'Failed',
	updated: NonNullable<ReconcileResponse['updated']>,
	payload: {
		output?: { link: string; name: string } | null;
		errorMessage?: string | null;
	},
) {
		const data =
			status === 'Completed'
			? {
					playlistName: payload.output?.name,
					playlistLink: payload.output?.link,
					playlistId: payload.output?.link
						? payload.output.link.split('/').at(-1)
						: null,
					status: 'completed',
					errorMessage: null,
					completedAt: new Date(),
				}
			: {
					status: status.toLowerCase(),
					errorMessage:
						payload.errorMessage ||
						(status === 'Cancelled'
							? 'Generation was cancelled'
							: 'Generation failed'),
				};

	await prisma.generatedPlaylist.update({
		where: { id: record.id },
		data,
	});

	updated.push({
		generatedPlaylistId: record.id,
		status,
		output: status === 'Completed' ? (payload.output ?? null) : null,
		errorMessage: status === 'Completed' ? undefined : data.errorMessage,
	});
}
