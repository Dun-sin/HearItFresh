import axios, { AxiosError } from "axios";

import { NextResponse } from "next/server";
import { getUser } from "@/app/lib/spotify";
import { sql } from "@vercel/postgres";
import prisma from "@/app/lib/prisma";

const redirect_uri = process.env.REDIRECT_URL;
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

export async function POST(req: Request) {
	const res = await req.json();
	const code = res.code;
	if (!code) {
		return Response.json({ error: "Invalid request" }, { status: 400 });
	}

	try {
		const response = await axios.post(
			"https://accounts.spotify.com/api/token",
			{
				grant_type: "authorization_code",
				code,
				redirect_uri,
			},
			{
				headers: {
					Authorization:
						"Basic " +
						Buffer.from(client_id + ":" + client_secret).toString("base64"),
					"content-Type": "application/x-www-form-urlencoded",
				},
			}
		);

		console.log(response);

		const { access_token, refresh_token, expires_in } = response.data;
		const user = await getUser(access_token);

		if (user) {
			const prismaUser = await prisma.user.upsert({
				where: { userId: user.user_id },
				create: {
					displayName: user.display_name,
					userId: user.user_id,
					profileImageUrl: user.profile_image_url,
				},
				update: {},
			});
			console.log(prismaUser);
		}

		//* Former sql code converted to prisma orm here. */
		//     INSERT INTO users (display_name, user_id, profile_image_url)
		//     VALUES (${user.display_name}, ${user.user_id}, ${user.profile_image_url})
		//     ON CONFLICT (user_id) DO NOTHING;  -- Avoid duplicates
		// `;

		return NextResponse.json(
			{ expires_in, refresh_token, access_token, user },
			{ status: 200 }
		);
	} catch (error) {
		console.log(error);
		error = error as AxiosError;
		return NextResponse.json({ error }, { status: 400 });
	}
}
