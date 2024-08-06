'use client';

import React, { ReactNode, createContext, useContext, useState } from 'react';

interface LoadingContextProps {
	loading: boolean;
	setLoading: (loading: boolean) => void;
	loadingMessage: string | null;
	setLoadingMessage: (message: string | null) => void;
}

const LoadingContext = createContext<LoadingContextProps | undefined>(
	undefined,
);

const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [loading, setLoading] = useState<boolean>(false);
	const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

	return (
		<LoadingContext.Provider
			value={{ loading, setLoading, loadingMessage, setLoadingMessage }}>
			{children}
		</LoadingContext.Provider>
	);
};

const useLoading = (): LoadingContextProps => {
	const context = useContext(LoadingContext);
	if (!context) {
		throw new Error('useLoading must be used within a LoadingProvider');
	}
	return context;
};

export { LoadingProvider, useLoading };
