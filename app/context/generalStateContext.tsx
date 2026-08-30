'use client';

import React, {
	ReactNode,
	createContext,
	useContext,
	useMemo,
	useState,
} from 'react';

import type { ProviderName } from '@/app/lib/providers/types';

interface PlayListData {
	link: string;
	name: string;
	provider?: ProviderName;
}

interface ErrorMessages {
	notCorrectSpotifyLink: boolean;
	notCorrectFormatForArtist: boolean;
	error: any;
}

interface GeneralStateContextProps {
	playListData: PlayListData;
	setPlayListData: (data: PlayListData) => void;
	buttonClick: boolean;
	setButtonClicked: (clicked: boolean) => void;
	errorMessages: ErrorMessages;
	setErrorMessages: (errors: ErrorMessages) => void;
	provider: ProviderName;
	setProvider: (provider: ProviderName) => void;
}

const GeneralStateContext = createContext<GeneralStateContextProps | undefined>(
	undefined,
);

const GeneralStateProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [playListData, setPlayListData] = useState<PlayListData>({
		link: '',
		name: '',
		provider: 'spotify',
	});
	const [buttonClick, setButtonClicked] = useState<boolean>(false);
	const [provider, setProvider] = useState<ProviderName>('spotify');
	const [errorMessages, setErrorMessages] = useState<ErrorMessages>({
		notCorrectSpotifyLink: false,
		notCorrectFormatForArtist: false,
		error: null,
	});

	const value = useMemo(
		() => ({
			playListData,
			setPlayListData,
			buttonClick,
			setButtonClicked,
			errorMessages,
			setErrorMessages,
			provider,
			setProvider,
		}),
		[playListData, buttonClick, errorMessages, provider],
	);

	return (
		<GeneralStateContext.Provider value={value}>
			{children}
		</GeneralStateContext.Provider>
	);
};

const useGeneralState = (): GeneralStateContextProps => {
	const context = useContext(GeneralStateContext);
	if (!context) {
		throw new Error(
			'useGeneralState must be used within a GeneralStateProvider',
		);
	}
	return context;
};

export { GeneralStateProvider, useGeneralState };
