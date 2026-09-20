'use client';

import { ReactNode, createContext, useContext, useState } from 'react';
import axios from 'axios';

import YoutubeChannelRequiredPrompt from '../components/YoutubeChannelRequiredPrompt';
import { useAuth } from './authContext';

type YoutubeChannelContextType = {
	ensureYoutubeChannel: () => Promise<boolean>;
	openChannelPrompt: () => void;
};

const YoutubeChannelContext = createContext<
	YoutubeChannelContextType | undefined
>(undefined);

export const YoutubeChannelProvider = ({
	children,
}: {
	children: ReactNode;
}) => {
	const { user, youtubeGuestCredentials } = useAuth();
	const [isPromptOpen, setIsPromptOpen] = useState(false);

	const ensureYoutubeChannel = async () => {
		const hasChannel = await axios
			.post('/api/youtube/channel', {
				userId: user?.user_id,
				youtubeGuestCredentials: user?.user_id
					? undefined
					: youtubeGuestCredentials,
			})
			.then(({ data }) => data.hasChannel !== false)
			.catch(() => true);

		if (!hasChannel) setIsPromptOpen(true);
		return hasChannel;
	};

	return (
		<YoutubeChannelContext.Provider
			value={{
				ensureYoutubeChannel,
				openChannelPrompt: () => setIsPromptOpen(true),
			}}>
			{children}
			{isPromptOpen && (
				<YoutubeChannelRequiredPrompt onClose={() => setIsPromptOpen(false)} />
			)}
		</YoutubeChannelContext.Provider>
	);
};

export const useYoutubeChannel = () => {
	const context = useContext(YoutubeChannelContext);
	if (!context) {
		throw new Error(
			'useYoutubeChannel must be used within a YoutubeChannelProvider',
		);
	}
	return context;
};
