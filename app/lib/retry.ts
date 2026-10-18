import { sleep } from './utils';

/**
 * Adapts a client's error shape so the retry loop doesn't need to know whether
 * it's talking to axios or spotify-web-api-node.
 */
export type ErrorShape = {
	status: (err: any) => number | undefined;
	retryAfterMs: (err: any) => number | undefined;
};

const toRetryAfterMs = (raw: unknown): number | undefined => {
	const seconds = Number(raw);
	return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : undefined;
};

export const axiosErrors: ErrorShape = {
	status: (err) => err?.response?.status,
	retryAfterMs: (err) => toRetryAfterMs(err?.response?.headers?.['retry-after']),
};

export const spotifyErrors: ErrorShape = {
	status: (err) => err?.statusCode ?? err?.status ?? err?.response?.status,
	retryAfterMs: (err) =>
		toRetryAfterMs(
			err?.headers?.['retry-after'] ?? err?.response?.headers?.['retry-after'],
		),
};

/**
 * A pause shared by every caller of one API: once any request is told to back
 * off, all of them wait it out instead of retrying on their own schedules.
 */
export type Cooldown = {
	wait: (signal?: AbortSignal) => Promise<void>;
	extend: (ms: number) => void;
};

export function createCooldown(): Cooldown {
	let until = 0;
	return {
		async wait(signal) {
			for (
				let remaining = until - Date.now();
				remaining > 0;
				remaining = until - Date.now()
			) {
				await sleep(remaining, signal);
			}
		},
		extend(ms) {
			until = Math.max(until, Date.now() + ms);
		},
	};
}

export type RetryOptions = {
	errors: ErrorShape;
	label: string;
	retryOn: number[];
	attempts?: number;
	signal?: AbortSignal;
	cooldown?: Cooldown;
};

const RATE_LIMIT_BASE_MS = 2000;
const DEFAULT_BASE_MS = 300;
const RETRY_AFTER_PADDING_MS = 500;

/**
 * Calls `fn` up to `attempts` times while the error's status is in `retryOn`,
 * honouring a `retry-after` header when the API sends one and backing off
 * exponentially otherwise. Anything else rethrows immediately, and the error
 * from the final attempt escapes without another wait. With a `cooldown`, the
 * backoff is applied to every caller sharing it.
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	{ errors, label, retryOn, attempts = 4, signal, cooldown }: RetryOptions,
): Promise<T> {
	const retryable = new Set(retryOn);

	for (let attempt = 0; ; attempt++) {
		await cooldown?.wait(signal);
		try {
			return await fn();
		} catch (err) {
			const status = errors.status(err);
			if (status === undefined || !retryable.has(status)) throw err;
			if (attempt + 1 >= attempts) throw err;

			const base = status === 429 ? RATE_LIMIT_BASE_MS : DEFAULT_BASE_MS;
			const retryAfter = errors.retryAfterMs(err);
			const delay =
				retryAfter !== undefined
					? retryAfter + RETRY_AFTER_PADDING_MS
					: base * 2 ** attempt + Math.floor(Math.random() * 250);

			console.warn(
				`${label}: ${status}, retrying in ${delay}ms (retry ${attempt + 1}/${attempts - 1})`,
			);
			if (cooldown) cooldown.extend(delay);
			else await sleep(delay, signal);
		}
	}
}
