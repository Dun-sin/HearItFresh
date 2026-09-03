import { createHmac, timingSafeEqual } from 'crypto';

import axios from 'axios';
import {
	findYoutubeConnection,
	saveYoutubeConnection,
	updateYoutubeConnectionTokens,
	removeYoutubeConnection,
} from '../../db';
import { decrypt, encrypt } from '../../utils';
import type { ProviderAuthCtx, YoutubeGuestCredentials } from '../types';

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const YOUTUBE_SCOPE = 'https://www.googleapis.com/auth/youtube';

/** Refresh buffer: treat a token as expired this many ms before its real expiry. */
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/** How long a signed connect `state` value stays valid for. */
const STATE_TTL_MS = 10 * 60 * 1000;


export function signYoutubeState(userId?: string | null): string {
	const expiresAt = Date.now() + STATE_TTL_MS;
	const payload = `${userId ?? ''}.${expiresAt}`;
	const sig = createHmac('sha256', process.env.SECRET_KEY as string)
		.update(payload)
		.digest('hex');
	return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

export type YoutubeStateResult =
	| { ok: true; userId: string | null }
	| { ok: false };

export function verifyYoutubeState(state: string): YoutubeStateResult {
	try {
		const decoded = Buffer.from(state, 'base64url').toString('utf8');
		const lastDot = decoded.lastIndexOf('.');
		if (lastDot <= 0) return { ok: false };
		const payload = decoded.slice(0, lastDot);
		const sig = decoded.slice(lastDot + 1);

		const expectedSig = createHmac('sha256', process.env.SECRET_KEY as string)
			.update(payload)
			.digest('hex');

		const sigBuf = Buffer.from(sig, 'hex');
		const expectedBuf = Buffer.from(expectedSig, 'hex');
		if (
			sigBuf.length !== expectedBuf.length ||
			!timingSafeEqual(sigBuf, expectedBuf)
		) {
			return { ok: false };
		}

		// `< 0`, not `<= 0`: a guest's payload has no subject, so it's
		// `.<expiresAt>` and the separator legitimately sits at index 0.
		const payloadLastDot = payload.lastIndexOf('.');
		if (payloadLastDot < 0) return { ok: false };
		const userId = payload.slice(0, payloadLastDot);
		const expiresAt = Number(payload.slice(payloadLastDot + 1));
		if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
			return { ok: false };
		}
		return { ok: true, userId: userId || null };
	} catch {
		return { ok: false };
	}
}

export async function getValidYoutubeToken(
	userId: string | null | undefined,
): Promise<string> {
	if (!userId) {
		throw new Error('No user id provided for YouTube token lookup');
	}

	const conn = await findYoutubeConnection(userId);
	if (!conn) {
		throw new Error('YouTube account not connected for this user');
	}

	const isExpired = Date.now() >= conn.expiresAt.getTime() - EXPIRY_BUFFER_MS;

	if (!isExpired) {
		return decrypt(conn.accessToken);
	}

	// Refresh the access token.
	const refreshToken = decrypt(conn.refreshToken);
	const body = new URLSearchParams({
		grant_type: 'refresh_token',
		refresh_token: refreshToken,
		client_id: client_id || '',
		client_secret: client_secret || '',
	}).toString();

	let response;
	try {
		response = await axios.post('https://oauth2.googleapis.com/token', body, {
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		});
	} catch (err: any) {
		const googleError = err?.response?.data?.error;
		if (err?.response?.status === 400 && googleError === 'invalid_grant') {
			await removeYoutubeConnection(userId);
			throw new Error(
				'Your YouTube connection has expired or was revoked. Please reconnect your YouTube account.',
			);
		}
		throw err;
	}

	const { access_token, refresh_token, expires_in } = response.data;
	const newExpiresAt = new Date(Date.now() + (expires_in ?? 3600) * 1000);

	const newRefresh = refresh_token ? encrypt(refresh_token) : conn.refreshToken;

	await updateYoutubeConnectionTokens(userId, {
		accessToken: encrypt(access_token),
		refreshToken: newRefresh,
		expiresAt: newExpiresAt,
	});

	return access_token;
}

async function getValidYoutubeTokenFromCredentials(
	creds: YoutubeGuestCredentials,
): Promise<string> {
	const expiresAt = new Date(creds.expiresAt).getTime();
	const isExpired = Date.now() >= expiresAt - EXPIRY_BUFFER_MS;
	if (!isExpired) return creds.accessToken;

	const refreshToken = decrypt(creds.refreshToken);
	const body = new URLSearchParams({
		grant_type: 'refresh_token',
		refresh_token: refreshToken,
		client_id: client_id || '',
		client_secret: client_secret || '',
	}).toString();

	const response = await axios.post(
		'https://oauth2.googleapis.com/token',
		body,
		{
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		},
	);

	return response.data.access_token;
}

export async function resolveYoutubeAccessToken(
	ctx: ProviderAuthCtx,
): Promise<string> {
	if (ctx.youtubeGuestCredentials) {
		return getValidYoutubeTokenFromCredentials(ctx.youtubeGuestCredentials);
	}
	return getValidYoutubeToken(ctx.userId);
}

export async function upsertYoutubeConnection(params: {
	userId: string;
	accessToken: string;
	refreshToken: string;
	expiresAt: Date;
	scope?: string | null;
}): Promise<void> {
	await saveYoutubeConnection({
		userId: params.userId,
		accessToken: encrypt(params.accessToken),
		refreshToken: encrypt(params.refreshToken),
		expiresAt: params.expiresAt,
		scope: params.scope ?? null,
	});
}

export async function deleteYoutubeConnection(userId: string): Promise<void> {
	await removeYoutubeConnection(userId);
}

export async function getYoutubeConnectionStatus(userId: string): Promise<{
	connected: boolean;
	scope?: string | null;
	expiresAt?: string | null;
}> {
	const conn = await findYoutubeConnection(userId);
	if (!conn) return { connected: false };
	return {
		connected: true,
		scope: conn.scope,
		expiresAt: conn.expiresAt.toISOString(),
	};
}

export { YOUTUBE_SCOPE };
