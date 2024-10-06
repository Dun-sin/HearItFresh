'use client';

import React, { createContext, useContext, useState } from 'react';

import { HistoryEntry } from '../types';

type HistoryContextType = {
	history: HistoryEntry[] | null;
	isLoading: boolean;
	setHistory: (history: HistoryEntry[] | null) => void;
	setIsLoading: (isLoading: boolean) => void;
	removeHistoryItem: (text: string) => void;
};

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
	const [history, setHistory] = useState<HistoryEntry[] | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const removeHistoryItem = (text: string) => {
		setHistory((prevHistory) =>
			prevHistory ? prevHistory.filter((item) => item.text !== text) : null,
		);
	};

	const value = {
		history,
		isLoading,
		setHistory,
		setIsLoading,
		removeHistoryItem,
	};

	return (
		<HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
	);
}

export function useHistory() {
	const context = useContext(HistoryContext);
	if (context === undefined) {
		throw new Error('useHistory must be used within a HistoryProvider');
	}
	return context;
}
