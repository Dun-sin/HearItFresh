import { addUserHistory, getUserHistory } from "@/app/lib/db";

import { NextResponse } from "next/server";

export async function PUT(
	req: Request,
	{ params }: { params: { userId: string } }
) {
	const res = await req.json();
	const { artists } = res;

	const { userId } = params;

	if (!artists || !userId) {
		return Response.json({ error: "Invalid request" }, { status: 400 });
	}

	try {
		const response = await addUserHistory(userId, artists);

		if (response.message === "success") {
			return NextResponse.json({ status: 200 });
		} else {
			return NextResponse.json(
				{ message: `Could not update user history` },
				{ status: 400 }
			);
		}
	} catch (error) {
		return NextResponse.json({ error }, { status: 400 });
	}
}

export async function GET(
	req: Request,
	{ params }: { params: { userId: string } }
) {
	const { userId } = params;

	if (!userId) {
		return Response.json({ error: "Invalid request" }, { status: 400 });
	}
	try {
		const response = await getUserHistory(userId);
		return NextResponse.json({ message: response }, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error }, { status: 400 });
	}
}
