'use client';

import React, {
	ReactNode,
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';

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
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const GUEST_MODE_KEY = 'hif_guest_mode';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [isLoggedIn, setLoggedIn] = useState(false);
	const [isGuest, setIsGuest] = useState(false);
	const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
	const [isAuthInProgress, setAuthInProgress] = useState(false);

	useEffect(() => {
		try {
			if (localStorage.getItem(GUEST_MODE_KEY) === 'true') setIsGuest(true);
		} catch {
			// Storage can be unavailable (private mode / blocked cookies) — the
			// guest just re-picks "continue without logging in" in that case.
		}
	}, []);

	const logOut = () => {
		setLoggedIn(false);
		setIsGuest(false);
		setAuthInProgress(false);
    setAccessTokenState(null);
		localStorage.clear();
	};

	const logIn = () => {
		setIsGuest(false);
		setLoggedIn(true);
		setAuthInProgress(false);
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

	const value = useMemo(
		() => ({
			isLoggedIn,
			isGuest,
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
		}),
    [isLoggedIn, isGuest, isAuthInProgress, user, accessToken],
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
