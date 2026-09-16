'use client';

import React, {
	ReactNode,
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';

import type { YoutubeGuestCredentials } from '../lib/clientUtils';

const GUEST_MODE_KEY = 'hif_guest_mode';
const YOUTUBE_GUEST_CREDENTIALS_KEY = 'hif_youtube_guest_credentials';

const readYoutubeGuestCredentials = (): YoutubeGuestCredentials | null => {
	try {
		const raw = sessionStorage.getItem(YOUTUBE_GUEST_CREDENTIALS_KEY);
		return raw ? (JSON.parse(raw) as YoutubeGuestCredentials) : null;
	} catch {
		return null;
	}
};

const writeYoutubeGuestCredentials = (creds: YoutubeGuestCredentials | null) => {
	try {
		if (creds) {
			sessionStorage.setItem(
				YOUTUBE_GUEST_CREDENTIALS_KEY,
				JSON.stringify(creds),
			);
		} else {
			sessionStorage.removeItem(YOUTUBE_GUEST_CREDENTIALS_KEY);
		}
	} catch {}
};

interface User {
	display_name: string;
	user_id: string;
	profile_image_url: string;
}

interface AuthProviderProps {
	children: ReactNode;
}

interface AuthContextProps {
	isLoggedIn: boolean;
	isGuest: boolean;
	isAuthHydrated: boolean;
	isAuthInProgress: boolean;
	user: User | null;
	accessToken: string | null;
	logIn: () => void;
	logOut: () => void;
	continueAsGuest: () => void;
	exitGuestMode: () => void;
	authInProgress: (state: boolean) => void;
	setUserData: (data: User | null) => void;
	setAccessToken: (token: string | null) => void;
	youtubeGuestCredentials: YoutubeGuestCredentials | null;
	setYoutubeGuestCredentials: (creds: YoutubeGuestCredentials | null) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [isLoggedIn, setLoggedIn] = useState(false);
	const [isGuest, setIsGuest] = useState(false);
	const [user, setUser] = useState<User | null>(null);
	const [accessToken, setAccessTokenState] = useState<string | null>(null);
	const [youtubeGuestCredentials, setYoutubeGuestCredentialsState] =
		useState<YoutubeGuestCredentials | null>(null);
	const [isAuthInProgress, setAuthInProgress] = useState(false);
	const [isAuthHydrated, setAuthHydrated] = useState(false);

	useEffect(() => {
		try {
			if (localStorage.getItem(GUEST_MODE_KEY) === 'true') setIsGuest(true);
		} catch {
			// Storage can be unavailable (private mode / blocked cookies) — the
			// guest just re-picks "continue without logging in" in that case.
		}
		setYoutubeGuestCredentialsState(readYoutubeGuestCredentials());
		setAuthHydrated(true);
	}, []);

	const logOut = () => {
		setLoggedIn(false);
		setIsGuest(false);
		setAuthInProgress(false);
		setAccessTokenState(null);
		setYoutubeGuestCredentials(null);
		localStorage.clear();
	};

	const logIn = () => {
		setIsGuest(false);
		setLoggedIn(true);
		setAuthInProgress(false);
		setYoutubeGuestCredentials(null);
		try {
			localStorage.removeItem(GUEST_MODE_KEY);
		} catch {}
	};

	const continueAsGuest = () => {
		setIsGuest(true);
		setAuthInProgress(false);
		try {
			localStorage.setItem(GUEST_MODE_KEY, 'true');
		} catch {}
	};

	/**
	 * Drops guest mode so the login screen comes back — this is the only way
	 * out for someone who picked "continue without logging in", since that
	 * choice now survives a reload.
	 */
	const exitGuestMode = () => {
		setIsGuest(false);
		try {
			localStorage.removeItem(GUEST_MODE_KEY);
		} catch {}
	};

	const authInProgress = (state: boolean) => setAuthInProgress(state);

	const setUserData = (data: User | null) => setUser(data);
	const setAccessToken = (token: string | null) => setAccessTokenState(token);
	const setYoutubeGuestCredentials = (creds: YoutubeGuestCredentials | null) => {
		writeYoutubeGuestCredentials(creds);
		setYoutubeGuestCredentialsState(creds);
	};

	const value = useMemo(
		() => ({
			isLoggedIn,
			isGuest,
			isAuthHydrated,
			isAuthInProgress,
			user,
			accessToken,
			logOut,
			logIn,
			continueAsGuest,
			exitGuestMode,
			authInProgress,
			setUserData,
			setAccessToken,
			youtubeGuestCredentials,
			setYoutubeGuestCredentials,
		}),
		[
			isLoggedIn,
			isGuest,
			isAuthHydrated,
			isAuthInProgress,
			user,
			accessToken,
			youtubeGuestCredentials,
		],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
