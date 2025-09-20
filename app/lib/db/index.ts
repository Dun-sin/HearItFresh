"use server";

import { sql } from "@vercel/postgres";
import prisma from "../prisma";

export interface HistoryEntry {
	text: string;
	lastUsed: string;
}

export async function addUserHistory(
	userId: string,
	artists: string
): Promise<{ message: string; history: HistoryEntry[] }> {
	try {
		const lastUsed = new Date();
		const lastUsedString = lastUsed.toISOString();
		const newObject: HistoryEntry = { text: artists, lastUsed: lastUsedString };

		const result = await getUserHistory(userId);

		let currentHistory: HistoryEntry[] = result ? result : [];
		console.log(result);

		const artistExists = currentHistory.find(
			(entry: HistoryEntry) => entry.text === artists
		);

		if (artistExists) {
			const updatedHistory = currentHistory.map((entry: HistoryEntry) =>
				entry.text === artists ? { ...entry, lastUsed: lastUsedString } : entry
			);

			await prisma.user.update({
				where: { userId },
				data: {
					history: updatedHistory,
				},
			});

			// await sql`
			//   UPDATE users
			//   SET history = ${JSON.stringify(updatedHistory)}::jsonb
			//   WHERE user_id = ${userId};
			// `;
			console.log("Updated existing history entry");
		} else {
			currentHistory = [...currentHistory, newObject];
			await prisma.user.update({
				where: { userId },
				data: { history: currentHistory },
			});
			// await sql`
			//   UPDATE users
			//   SET history = history || ${JSON.stringify([newObject])}::jsonb
			//   WHERE user_id = ${userId};
			// `;
			console.log("New history entry added");
		}

		// Fetch the updated history from the database
		const updatedResult = await getUserHistory(userId);
		const updatedHistory: HistoryEntry[] = updatedResult ? updatedResult : [];

		return { message: "success", history: updatedHistory };
	} catch (error) {
		console.error("Error updating history:", error);
		return { message: "error", history: [] };
	}
}

export async function removeUserHistory(
	userId: string,
	artistToRemove: string
): Promise<string> {
	try {
		const history = await getUserHistory(userId);
		const currentHistory: HistoryEntry[] = history ? history : [];

		const updatedHistory = currentHistory.filter(
			(entry: HistoryEntry) => entry.text !== artistToRemove
		);

		await prisma.user.update({
			where: { userId },
			data: { history: updatedHistory },
		});
		//* former vercel postgres sql code */
		// await sql`
		//   UPDATE users
		//   SET history = ${JSON.stringify(updatedHistory)}::jsonb
		//   WHERE user_id = ${userId};
		// `;

		console.log("History entry removed");
		return "success";
	} catch (error) {
		console.error("Error removing history:", error);
		return "error";
	}
}

export async function getUserHistory(
	userId: string
): Promise<HistoryEntry[] | null | undefined> {
	try {
		// return await sql`
		//   SELECT history FROM users WHERE user_id = ${userId};
		// `;

		const history = (await prisma.user.findUnique({ where: { userId } }))
			?.history;

		return history as unknown as HistoryEntry[];
	} catch (error) {
		console.error("Error fetching user history:", error);
		throw error;
	}
}
