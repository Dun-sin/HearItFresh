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
	isAuthInProgress: boolean;
	user: User | null;
	logIn: () => void;
	logOut: () => void;
	authInProgress: (state: boolean) => void;
	setUserData: (data: User | null) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [isLoggedIn, setLoggedIn] = useState(false);
	const [user, setUser] = useState<User | null>(null);
	const [isAuthInProgress, setAuthInProgress] = useState(false);

	const logOut = () => {
		setLoggedIn(false);
		setAuthInProgress(false);
		localStorage.clear();
	};

	const logIn = () => {
		setLoggedIn(true);
		setAuthInProgress(false);
	};

	const authInProgress = (state: boolean) => setAuthInProgress(state);

	const setUserData = (data: User | null) => setUser(data);

	const value = useMemo(
		() => ({
			isLoggedIn,
			isAuthInProgress,
			user,
			logOut,
			logIn,
			authInProgress,
			setUserData,
		}),
		[isLoggedIn, isAuthInProgress, user],
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
