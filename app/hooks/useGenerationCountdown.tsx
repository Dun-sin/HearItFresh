'use client';

import { useEffect, useState } from 'react';

export const CYCLE_MS = 3 * 60 * 1000;
export const MAX_CYCLES = 2;

const derive = (startedAt: number | null) => {
	if (startedAt === null) {
		return { cycle: 0, remainingMs: CYCLE_MS, exhausted: false };
	}

	const elapsed = Math.max(0, Date.now() - startedAt);
	const cycle = Math.floor(elapsed / CYCLE_MS);

	return {
		cycle,
		remainingMs: CYCLE_MS - (elapsed % CYCLE_MS),
		exhausted: cycle >= MAX_CYCLES,
	};
};

const useGenerationCountdown = (startedAt: number | null) => {
	const [state, setState] = useState(() => derive(startedAt));

	useEffect(() => {
		setState(derive(startedAt));

		if (startedAt === null) return;

		const id = setInterval(() => {
			const next = derive(startedAt);
			setState(next);
			if (next.exhausted) clearInterval(id);
		}, 1000);

		return () => clearInterval(id);
	}, [startedAt]);

	return state;
};

export default useGenerationCountdown;
