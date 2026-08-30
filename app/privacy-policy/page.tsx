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
				<p className='text-sm opacity-70'>Last updated: August 30, 2026</p>
			</div>

			<p>
				This Privacy Policy explains what information HearItFresh (&quot;we&quot;,
				&quot;our&quot;, &quot;the app&quot;) collects, why, and how it&apos;s handled
				when you use the app, including its integration with your YouTube account.
			</p>

			<div>
				<h2 className='text-xl font-semibold mb-2'>1. Overview</h2>
				<p>
					HearItFresh is a music recommendation tool that generates playlists based
					on lyrical similarity to songs you select as seeds. Optionally, you can
					connect your YouTube account so the app can create and manage a playlist
					directly on your behalf.
				</p>
				<p>
					We do not run any analytics or tracking on this app. We do not sell or
					share your data with third parties, and we do not use your data for
					advertising.
				</p>
			</div>

			<div>
				<h2 className='text-xl font-semibold mb-2'>2. Information We Collect</h2>

				<h3 className='font-medium mt-3 mb-1'>Song and playlist data</h3>
				<p>
					When you use the app, you provide seed songs/artists used to generate
					recommendations. This information is used only to generate your playlist
					and is not linked to your identity beyond what&apos;s described below.
				</p>

				<h3 className='font-medium mt-3 mb-1'>YouTube account access (optional)</h3>
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
					account, we do not use it for anything beyond the actions listed above.
					We do not upload videos, manage subscriptions, post comments, or change
					any channel settings on your behalf.
				</p>
			</div>

			<div>
				<h2 className='text-xl font-semibold mb-2'>
					3. How We Store Your Information
				</h2>

				<h3 className='font-medium mt-3 mb-1'>Signed-in users</h3>
				<p>
					If you create an account with us and connect YouTube, we store your OAuth
					access token, refresh token, token expiry, and the granted scope string.
				</p>
				<p>
					This information is encrypted at rest and is retained until:
				</p>
				<ul className='list-disc list-inside'>
					<li>You disconnect your YouTube account, or</li>
					<li>
						Google reports the token as revoked or invalid (in which case it is
						automatically deleted), or
					</li>
					<li>
						You delete your account with us (in which case this data is deleted
						along with it)
					</li>
				</ul>

				<h3 className='font-medium mt-3 mb-1'>Guest users</h3>
				<p>
					If you use the app without signing into an account, no data is stored on
					our servers. Your YouTube OAuth tokens exist only in your browser&apos;s
					memory for the duration of a single playlist-generation request and are
					discarded immediately afterward.
				</p>
			</div>

			<div>
				<h2 className='text-xl font-semibold mb-2'>4. What We Don&apos;t Do</h2>
				<ul className='list-disc list-inside'>
					<li>
						We do not run analytics, ad tracking, or third-party tracking scripts
						of any kind
					</li>
					<li>We do not sell, rent, or share your personal data with third parties</li>
					<li>We do not use your YouTube data to train any models</li>
					<li>
						We do not access or store any YouTube account data beyond what&apos;s
						needed for playlist creation/management as described above
					</li>
				</ul>
			</div>

			<div>
				<h2 className='text-xl font-semibold mb-2'>5. Revoking Access</h2>
				<p>
					You can disconnect your YouTube account from HearItFresh at any time from
					your account settings. You can also revoke access directly from your{' '}
					<a
						href='https://myaccount.google.com/permissions'
						target='_blank'
						rel='noopener noreferrer'
						className='text-brand underline'>
						Google Account permissions page
					</a>
					, which will immediately invalidate the tokens we hold.
				</p>
			</div>

			<div>
				<h2 className='text-xl font-semibold mb-2'>6. Data Deletion</h2>
				<p>If you&apos;d like your data deleted, you can:</p>
				<ul className='list-disc list-inside'>
					<li>Disconnect your YouTube account (removes stored tokens), and/or</li>
					<li>Delete your account entirely (removes all associated data), and/or</li>
					<li>
						Contact us at{' '}
						<a
							href='mailto:dunsincodes@gmail.com'
							className='text-brand underline'>
							dunsincodes@gmail.com
						</a>{' '}
						to request deletion manually
					</li>
				</ul>
			</div>

			<div>
				<h2 className='text-xl font-semibold mb-2'>7. Children&apos;s Privacy</h2>
				<p>
					This app is not directed at children under 13, and we do not knowingly
					collect data from children under 13.
				</p>
			</div>

			<div>
				<h2 className='text-xl font-semibold mb-2'>8. Changes to This Policy</h2>
				<p>
					We may update this policy from time to time. Changes will be posted on
					this page with an updated &quot;Last updated&quot; date.
				</p>
			</div>

			<div>
				<h2 className='text-xl font-semibold mb-2'>9. Contact</h2>
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
