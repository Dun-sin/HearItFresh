'use client';

import { CYCLE_MS, MAX_CYCLES } from '@/app/hooks/useGenerationCountdown';
import { GuestGeneration } from '../types';

const STORAGE_KEY = 'hearitfresh:pendingGeneration';
const GUEST_KEY = 'hearitfresh:lastGuestGeneration';
// Past the countdown budget there's nothing left to resume into
const MAX_AGE_MS = CYCLE_MS * MAX_CYCLES;

export type PendingGeneration = {
	generatedPlaylistId: string | null;
	eventId: string | null;
	runId: string | null;
	cancellationId: string | null;
	userId: string | null;
	startedAt: number;
	artistName?: string;
};

const bail = () => {
	clearPendingGeneration();
	return null;
};

export const readPendingGeneration = (): PendingGeneration | null => {
	if (typeof window === 'undefined') return null;

	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;

		const record = JSON.parse(raw) as PendingGeneration;

		if (typeof record?.startedAt !== 'number') return bail();
		if (Date.now() - record.startedAt > MAX_AGE_MS) return bail();
		if (!record.generatedPlaylistId && !record.eventId && !record.runId)
			return bail();

		return record;
	} catch (error) {
		console.log('Error reading pending generation', error);
		return null;
	}
};

export const savePendingGeneration = (record: PendingGeneration) => {
	if (typeof window === 'undefined') return;

	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
	} catch (error) {
		console.log('Error saving pending generation', error);
	}
};

export const patchPendingGeneration = (patch: Partial<PendingGeneration>) => {
	const current = readPendingGeneration();
	if (!current) return;

	savePendingGeneration({ ...current, ...patch });
};

export const clearPendingGeneration = () => {
	if (typeof window === 'undefined') return;

	try {
		window.localStorage.removeItem(STORAGE_KEY);
	} catch (error) {
		console.log('Error clearing pending generation', error);
	}
};

export const readGuestGeneration = (): GuestGeneration | null => {
	if (typeof window === 'undefined') return null;

	try {
		const raw = window.localStorage.getItem(GUEST_KEY);
		if (!raw) return null;

		const record = JSON.parse(raw) as GuestGeneration;

		if (typeof record?.startedAt !== 'number') {
			clearGuestGeneration();
			return null;
		}
		if (!record.runId && !record.eventId && !record.link) {
			clearGuestGeneration();
			return null;
		}

		return record;
	} catch (error) {
		console.log('Error reading guest generation', error);
		return null;
	}
};

export const saveGuestGeneration = (record: GuestGeneration) => {
	if (typeof window === 'undefined') return;

	try {
		window.localStorage.setItem(GUEST_KEY, JSON.stringify(record));
	} catch (error) {
		console.log('Error saving guest generation', error);
	}
};

export const patchGuestGeneration = (patch: Partial<GuestGeneration>) => {
	const current = readGuestGeneration();
	if (!current) return;

	saveGuestGeneration({ ...current, ...patch });
};

export const clearGuestGeneration = () => {
	if (typeof window === 'undefined') return;

	try {
		window.localStorage.removeItem(GUEST_KEY);
	} catch (error) {
		console.log('Error clearing guest generation', error);
	}
};