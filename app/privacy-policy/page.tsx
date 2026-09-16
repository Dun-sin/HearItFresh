import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Privacy Policy | HearItFresh',
	description: 'Privacy Policy for HearItFresh',
};

const PrivacyPolicyPage = () => {
	return (
		<section className='flex flex-col gap-6 max-w-[800px] w-full min-w-[300px] px-5 py-10 leading-relaxed'>
			<div>
				<h1 className='text-2xl font-bold'>Privacy Policy</h1>
				<p className='text-sm opacity-70'>Last updated: September 16, 2026</p>
			</div>

			<p>
				This Privacy Policy explains what information HearItFresh collects, why,
				and how it&apos;s handled when you use the app, including its
				integration with your YouTube account.
			</p>

			<p>
				HearItFresh uses YouTube API Services. By connecting your YouTube
				account or using the app&apos;s YouTube features, you agree to be bound
				by the{' '}
				<a
					href='https://www.youtube.com/t/terms'
					target='_blank'
					rel='noopener noreferrer'
					className='text-brand underline'>
					YouTube Terms of Service
				</a>
				. Google&apos;s handling of your data is described in the{' '}
				<a
					href='http://www.google.com/policies/privacy'
					target='_blank'
					rel='noopener noreferrer'
					className='text-brand underline'>
					Google Privacy Policy
				</a>
				.
			</p>

			<div>
				<h2 className='text-xl font-semibold mb-2'>1. Overview</h2>
				<p>
					HearItFresh is a music recommendation tool that generates playlists
					based on lyrical similarity to songs you select as seeds. Optionally,
					you can connect your YouTube account so the app can create and manage
					a playlist directly on your behalf.
				</p>
				<p>
					We do not run any analytics or tracking on this app. We do not sell or
					share your data with third parties, and we do not use your data for
					advertising.
				</p>
			</div>

			<div>
				<h2 className='text-xl font-semibold mb-2'>
					2. Information We Collect
				</h2>

				<h3 className='font-medium mt-3 mb-1'>Google account profile</h3>
				<p>
					When you sign in with Google, we receive and store your Google user
					ID, display name, and profile image URL. We use these only to identify
					your account inside the app and to show you who you&apos;re signed in
					as. We do not request access to your email address.
				</p>

				<h3 className='font-medium mt-3 mb-1'>Song and playlist data</h3>
				<p>
					You provide seed songs/artists used to generate recommendations. For
					signed-in users we store the seeds you chose, the resulting
					recommended tracks, and details of the playlists we created for you
					(name, link, and status), so you can see your generation history and
					resume or retry a generation that was interrupted.
				</p>

				<h3 className='font-medium mt-3 mb-1'>
					YouTube account access (optional)
				</h3>
				<p>
					If you choose to connect your YouTube account, the app requests the
					following Google OAuth scope:
				</p>
				<ul className='list-disc list-inside'>
					<li>
						<code>https://www.googleapis.com/auth/youtube</code>
					</li>
				</ul>
				<p>We request this scope solely to:</p>
				<ul className='list-disc list-inside'>
					<li>
						Read the videos in a YouTube playlist you paste into the app, so
						they can be used as seeds for your recommendations
					</li>
					<li>Create a new playlist on your connected YouTube account</li>
					<li>Add videos to that playlist</li>
					<li>Remove videos from that playlist</li>
					<li>
						Read back the playlist&apos;s contents and details so we can display
						them in the app
					</li>
				</ul>
				<p>
					Although this scope technically grants broader access to your YouTube
					account, we do not use it for anything beyond the actions listed
					above. We do not upload videos, manage subscriptions, post comments,
					or change any channel settings on your behalf.
				</p>
			</div>

			<div>
				<h2 className='text-xl font-semibold mb-2'>
					3. Where Your Information Is Kept
				</h2>

				<h3 className='font-medium mt-3 mb-1'>Sign-in tokens</h3>
				<p>
					The tokens that keep you signed in are not stored in our database.
					Your refresh token is encrypted by our server, using a secret key that
					never leaves the server, before it is returned to your browser. Your
					browser holds that encrypted refresh token, plus a short-lived access
					token, in its local storage on your own device. Signing out removes
					them.
				</p>

				<h3 className='font-medium mt-3 mb-1'>
					YouTube connection (signed-in users)
				</h3>
				<p>
					When you connect YouTube while signed in, we store your YouTube OAuth
					access token and refresh token in our database, together with the
					token&apos;s expiry time and the scope you granted. Both tokens are
					encrypted before they are written. We keep them so your connection
					persists between visits, and delete them when you disconnect YouTube,
					when Google reports them as revoked or expired, or when your account
					is deleted.
				</p>

				<h3 className='font-medium mt-3 mb-1'>
					YouTube connection (guest users)
				</h3>
				<p>
					When you connect YouTube as a guest, your YouTube tokens are not
					stored on our servers. They are held in your browser&apos;s session
					storage for the current tab only, with the refresh token encrypted,
					and are sent to our servers only for the duration of a request that
					needs them, such as reading or building a playlist. They are removed
					when you close the tab or disconnect YouTube.
				</p>

				<h3 className='font-medium mt-3 mb-1'>Account and playlist data</h3>
				<p>
					For signed-in users, the profile, seed, and playlist data described in
					section 2 is stored in our managed database, which is encrypted at
					rest by the hosting provider.
				</p>

				<h3 className='font-medium mt-3 mb-1'>Guest users</h3>
				<p>
					If you use the app without signing into an account, we do not create
					an account record for you.
				</p>

				<h3 className='font-medium mt-3 mb-1'>Storage on your device</h3>
				<p>
					HearItFresh does not use cookies to track you. It uses your
					browser&apos;s local storage and session storage only to keep you
					signed in, remember whether you chose guest mode, hold a guest YouTube
					connection, and resume a playlist generation that was interrupted.
					Clearing the app&apos;s site data removes all of it.
				</p>
			</div>

			<div>
				<h2 className='text-xl font-semibold mb-2'>
					4. How We Protect Your Data
				</h2>
				<p>
					We treat your Google OAuth credentials as sensitive data and apply the
					following protections:
				</p>
				<ul className='list-disc list-inside'>
					<li>
						<strong>Encryption in transit.</strong> All traffic between your
						browser, our servers, and Google&apos;s APIs is served over HTTPS
						using TLS 1.2 or higher.
					</li>
					<li>
						<strong>Encryption of OAuth tokens.</strong> YouTube tokens stored
						in our database are encrypted with AES before they are written, and
						refresh tokens returned to your browser are encrypted before they
						leave our server. The encryption key is held only in our server-side
						configuration; it is never sent to your device and never committed
						to our source code.
					</li>
					<li>
						<strong>Encryption at rest.</strong> Our database is a managed
						instance with provider-managed encryption at rest, and our
						application secrets are held in our hosting provider&apos;s
						encrypted secret store.
					</li>
					<li>
						<strong>Data minimisation.</strong> We request a single YouTube
						scope, used only for the playlist actions listed in section 2. We
						store YouTube tokens only for signed-in users who choose to connect,
						and never store tokens for guests.
					</li>
					<li>
						<strong>Short credential lifetime.</strong> Google access tokens are
						short-lived (approximately one hour) and expire on their own. Once
						you revoke access, any token we hold stops working immediately, and
						the app discards a token that Google reports as revoked or invalid.
					</li>
					<li>
						<strong>Access control.</strong> Access to the production database,
						hosting environment, and secrets is restricted to authorised
						administrator accounts protected by two-factor authentication. No
						third party, contractor, or advertiser is granted access.
					</li>
				</ul>
				<p>
					No system can be guaranteed completely secure. If we become aware of a
					breach affecting your personal data or your Google user data, we will
					revoke the affected credentials and post a notice in the app and on
					this page without undue delay.
				</p>
			</div>

			<div>
				<h2 className='text-xl font-semibold mb-2'>
					5. Google User Data and Limited Use
				</h2>
				<p>
					HearItFresh&apos;s use and transfer of information received from
					Google APIs adheres to the{' '}
					<a
						href='https://developers.google.com/terms/api-services-user-data-policy'
						target='_blank'
						rel='noopener noreferrer'
						className='text-brand underline'>
						Google API Services User Data Policy
					</a>
					, including the Limited Use requirements. Specifically, we do not
					transfer Google user data to third parties except as necessary to
					provide or improve the playlist feature, to comply with applicable
					law, or as part of a merger or acquisition; we do not use Google user
					data for advertising; we do not allow humans to read your Google user
					data unless you give explicit consent, it is necessary for security
					purposes or to comply with applicable law, or the data has been
					aggregated and de-identified; and we do not use Google user data to
					develop, improve, or train generalised or non-personalised AI or
					machine learning models.
				</p>
			</div>

			<div>
				<h2 className='text-xl font-semibold mb-2'>6. What We Don&apos;t Do</h2>
				<ul className='list-disc list-inside'>
					<li>
						We do not run analytics, ad tracking, or third-party tracking
						scripts of any kind
					</li>
					<li>
						We do not sell, rent, or share your personal data with third parties
					</li>
					<li>
						We do not allow third parties to serve content or advertisements in
						the app
					</li>
					<li>We do not use your YouTube data to train any models</li>
					<li>
						We do not access or store any YouTube account data beyond
						what&apos;s needed for playlist creation/management as described
						above
					</li>
				</ul>
			</div>

			<div>
				<h2 className='text-xl font-semibold mb-2'>7. Revoking Access</h2>
				<p>You can remove HearItFresh&apos;s access at any time:</p>
				<ul className='list-disc list-inside'>
					<li>
						Open Settings in the app and choose{' '}
						<strong>Disconnect YouTube</strong>. This revokes the app&apos;s
						YouTube access with Google and deletes any YouTube tokens we hold.
					</li>
					<li>
						Sign out, which clears the sign-in tokens held in your browser.
					</li>
					<li>
						Revoke access from the{' '}
						<a
							href='https://security.google.com/settings/security/permissions'
							target='_blank'
							rel='noopener noreferrer'
							className='text-brand underline'>
							Google security settings page
						</a>
						, which immediately invalidates every token issued to the app.
					</li>
				</ul>
			</div>

			<div>
				<h2 className='text-xl font-semibold mb-2'>
					8. Data Retention and Deletion
				</h2>
				<p>
					Account, seed, and playlist history data is retained for as long as
					your account exists, so that your history remains available to you.
					YouTube tokens are retained only until you disconnect YouTube, Google
					reports them as revoked, or your account is deleted. To have your data
					removed, you can:
				</p>
				<ul className='list-disc list-inside'>
					<li>
						Disconnect YouTube from Settings, which deletes your stored YouTube
						tokens, and/or
					</li>
					<li>
						Email us at{' '}
						<a
							href='mailto:dunsincodes@gmail.com'
							className='text-brand underline'>
							dunsincodes@gmail.com
						</a>{' '}
						to request deletion of your account and all associated data. We
						action these requests within 30 days.
					</li>
				</ul>
			</div>

			<div>
				<h2 className='text-xl font-semibold mb-2'>
					9. Children&apos;s Privacy
				</h2>
				<p>
					This app is not directed at children under 13, and we do not knowingly
					collect data from children under 13.
				</p>
			</div>

			<div>
				<h2 className='text-xl font-semibold mb-2'>
					10. Changes to This Policy
				</h2>
				<p>
					We may update this policy from time to time. Changes will be posted on
					this page with an updated &quot;Last updated&quot; date.
				</p>
			</div>

			<div>
				<h2 className='text-xl font-semibold mb-2'>11. Contact</h2>
				<p>
					If you have questions about this policy or how your data is handled,
					contact us at:{' '}
					<a
						href='mailto:dunsincodes@gmail.com'
						className='text-brand underline'>
						dunsincodes@gmail.com
					</a>
				</p>
			</div>
		</section>
	);
};

export default PrivacyPolicyPage;
