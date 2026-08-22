'use client';

import React, {
	ReactNode,
	createContext,
	useContext,
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
	authInProgress: (state: boolean) => void;
	setUserData: (data: User | null) => void;
  setAccessToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [isLoggedIn, setLoggedIn] = useState(false);
	const [isGuest, setIsGuest] = useState(false);
	const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
	const [isAuthInProgress, setAuthInProgress] = useState(false);

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
	};

	const continueAsGuest = () => {
		setIsGuest(true);
		setAuthInProgress(false);
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
