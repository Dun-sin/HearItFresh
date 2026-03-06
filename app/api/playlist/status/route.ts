export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const eventId = searchParams.get('eventId');

	if (!eventId) return Response.json({ error: 'No eventId' }, { status: 400 });

	const baseUrl =
		process.env.NODE_ENV === 'production'
			? 'https://api.inngest.com'
			: 'http://localhost:8288';

	const response = await fetch(`${baseUrl}/v1/events/${eventId}/runs`, {
		headers: {
			Authorization: `Bearer ${process.env.INNGEST_SIGNING_KEY}`,
		},
	});

	const json = await response.json();
	const run = json.data?.[0];

	return Response.json({
		status: run?.status,
		output: run?.output,
	});
}
