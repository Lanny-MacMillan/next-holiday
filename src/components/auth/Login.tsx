"use client";

import { useAuth0 } from "@auth0/auth0-react";

export default function Login() {
	const { loginWithRedirect } = useAuth0();

	return (
		<div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
						Holiday Planner
					</h1>
					<p className="text-gray-600 dark:text-gray-300 mb-8">
						Plan your holidays with ease and keep track of everything in one
						place.
					</p>

					<button
						onClick={() => loginWithRedirect()}
						className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
					>
						Sign In
					</button>

					<p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
						Sign in to access your holiday planning dashboard
					</p>
				</div>
			</div>
		</div>
	);
}
