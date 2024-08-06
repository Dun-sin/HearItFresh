'use client';

import React, { ReactNode, createContext, useContext, useState } from 'react';

type Type = 'artist' | 'playlist';

interface TypeContextProps {
	type: Type;
	setType: (type: Type) => void;
}

const TypeContext = createContext<TypeContextProps | undefined>(undefined);

const TypeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [type, setType] = useState<Type>('artist');

	return (
		<TypeContext.Provider value={{ type, setType }}>
			{children}
		</TypeContext.Provider>
	);
};

const useType = (): TypeContextProps => {
	const context = useContext(TypeContext);
	if (!context) {
		throw new Error('useType must be used within a TypeProvider');
	}
	return context;
};

export { TypeProvider, useType };
