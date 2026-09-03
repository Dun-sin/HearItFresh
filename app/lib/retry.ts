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

export type RetryOptions = {
	errors: ErrorShape;
	label: string;
	retryOn: number[];
	attempts?: number;
	signal?: AbortSignal;
};

const RATE_LIMIT_BASE_MS = 2000;
const DEFAULT_BASE_MS = 300;

/**
 * Retries `fn` while the error's status is in `retryOn`, honouring a
 * `retry-after` header when the API sends one and backing off exponentially
 * otherwise. Anything else rethrows immediately, and the last error escapes
 * once attempts run out.
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	{ errors, label, retryOn, attempts = 4, signal }: RetryOptions,
): Promise<T> {
	const retryable = new Set(retryOn);
	let lastError: unknown;

	for (let attempt = 0; attempt < attempts; attempt++) {
		try {
			return await fn();
		} catch (err) {
			lastError = err;
			const status = errors.status(err);
			if (status === undefined || !retryable.has(status)) throw err;

			const base = status === 429 ? RATE_LIMIT_BASE_MS : DEFAULT_BASE_MS;
			const delay =
				errors.retryAfterMs(err) ??
				base * 2 ** attempt + Math.floor(Math.random() * 250);

			console.warn(
				`${label}: ${status}, retrying in ${delay}ms (attempt ${attempt + 1}/${attempts})`,
			);
			await sleep(delay, signal);
		}
	}

	throw lastError;
}
