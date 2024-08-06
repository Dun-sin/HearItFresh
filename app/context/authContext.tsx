'use client';

import React, { ReactNode, createContext, useContext, useState } from 'react';

interface AuthContextProps {
	isLoggedIn: boolean;
	isAuthInProgress: boolean;
	logIn: () => void;
	logOut: () => void;
	authInProgress: (state: boolean) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [isLoggedIn, setLoggedIn] = useState(false);
	const [isAuthInProgress, setAuthInProgress] = useState(false);

	const logOut = () => {
		setLoggedIn(false);
		setAuthInProgress(false);
	};

	const logIn = () => {
		setLoggedIn(true);
		setAuthInProgress(false);
	};

	const authInProgress = (state: boolean) => {
		setAuthInProgress(state);
	};

	return (
		<AuthContext.Provider
			value={{ isLoggedIn, logOut, logIn, isAuthInProgress, authInProgress }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = (): AuthContextProps => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};