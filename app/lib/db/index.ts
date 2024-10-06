'use server';

import { sql } from '@vercel/postgres';

export interface HistoryEntry {
	text: string;
	lastUsed: string;
}

export async function addUserHistory(
	userId: string,
	artists: string,
): Promise<{ message: string; history: HistoryEntry[] }> {
	try {
		const lastUsed = new Date();
		const lastUsedString = lastUsed.toISOString();
		const newObject: HistoryEntry = { text: artists, lastUsed: lastUsedString };

		const result = await getUserHistory(userId);

		const currentHistory: HistoryEntry[] = result?.rows[0]?.history || [];

		const artistExists = currentHistory.find(
			(entry: HistoryEntry) => entry.text === artists,
		);

		if (artistExists) {
			const updatedHistory = currentHistory.map((entry: HistoryEntry) =>
				entry.text === artists ? { ...entry, lastUsed: lastUsedString } : entry,
			);

			await sql`
        UPDATE users
        SET history = ${JSON.stringify(updatedHistory)}::jsonb
        WHERE user_id = ${userId};
      `;
			console.log('Updated existing history entry');
		} else {
			await sql`
        UPDATE users
        SET history = history || ${JSON.stringify([newObject])}::jsonb
        WHERE user_id = ${userId};
      `;
			console.log('New history entry added');
		}

		// Fetch the updated history from the database
		const updatedResult = await getUserHistory(userId);
		const updatedHistory: HistoryEntry[] =
			updatedResult?.rows[0]?.history || [];

		return { message: 'success', history: updatedHistory };
	} catch (error) {
		console.error('Error updating history:', error);
		return { message: 'error', history: [] };
	}
}

export async function removeUserHistory(
	userId: string,
	artistToRemove: string,
): Promise<string> {
	try {
		const result = await getUserHistory(userId);
		const currentHistory: HistoryEntry[] = result?.rows[0]?.history || [];

		const updatedHistory = currentHistory.filter(
			(entry: HistoryEntry) => entry.text !== artistToRemove,
		);

		await sql`
      UPDATE users
      SET history = ${JSON.stringify(updatedHistory)}::jsonb
      WHERE user_id = ${userId};
    `;

		console.log('History entry removed');
		return 'success';
	} catch (error) {
		console.error('Error removing history:', error);
		return 'error';
	}
}

export async function getUserHistory(
	userId: string,
): Promise<{ rows: { history: HistoryEntry[] }[] }> {
	try {
		return await sql`
      SELECT history FROM users WHERE user_id = ${userId};
    `;
	} catch (error) {
		console.error('Error fetching user history:', error);
		throw error;
	}
}
