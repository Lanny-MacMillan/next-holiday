import Image from "next/image";
import Link from "next/link";
import ReduxExample from "@/components/ReduxExample";
// import ReduxTest from "@/components/ReduxTest";

export default function Home() {
	// Placeholder: In a real app, progress would be dynamic
	const christmasProgress = 0.4; // 40% complete

	return (
		<div className="min-h-screen christmas-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<h1 className="text-3xl font-bold text-center mb-2 text-gray-800 dark:text-white">
					Next Holiday
				</h1>
				<p className="text-center text-gray-600 dark:text-gray-400">
					Plan your holidays, stay organized, and have fun!
				</p>
			</header>
			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
					Upcoming Holidays
				</h2>
				<ul className="flex flex-col gap-4">
					<li>
						<Link
							href="/christmas"
							className="block text-gray-900 dark:text-white"
						>
							<div className="relative card rounded-2xl p-5 flex items-center gap-4 transition hover:scale-[1.02] active:scale-100">
								{/* Progress visual: floating germs (placeholder: globe.svg) */}
								<div className="relative w-16 h-16 flex-shrink-0">
									<Image
										src="/globe.svg"
										alt="Progress germs"
										fill
										className="object-contain animate-bounce"
									/>
									{/* Progress ring */}
									<svg
										className="absolute top-0 left-0 w-16 h-16"
										viewBox="0 0 64 64"
									>
										<circle
											cx="32"
											cy="32"
											r="28"
											fill="none"
											stroke="#e5e7eb"
											strokeWidth="6"
											className="dark:stroke-gray-600"
										/>
										<circle
											cx="32"
											cy="32"
											r="28"
											fill="none"
											stroke="#22c55e"
											strokeWidth="6"
											strokeDasharray={2 * Math.PI * 28}
											strokeDashoffset={
												2 * Math.PI * 28 * (1 - christmasProgress)
											}
											strokeLinecap="round"
											style={{ transition: "stroke-dashoffset 0.5s" }}
											className="dark:stroke-green-400"
										/>
									</svg>
								</div>
								<div className="flex-1">
									<h3 className="text-lg font-bold text-gray-800 dark:text-white">
										Christmas
									</h3>
									<p className="text-gray-600 dark:text-gray-400 text-sm">
										Plan cards, gifts, and more!
									</p>
									<div className="mt-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
										<div
											className="bg-green-400 dark:bg-green-500 h-2 rounded-full transition-all"
											style={{ width: `${christmasProgress * 100}%` }}
										/>
									</div>
									<span className="text-xs text-gray-500 dark:text-gray-500">
										{Math.round(christmasProgress * 100)}% complete
									</span>
								</div>
								<span className="ml-2 text-2xl text-gray-300 dark:text-gray-600">
									→
								</span>
							</div>
						</Link>
					</li>
				</ul>
			</main>
			{/* <div className="w-full max-w-4xl mt-8">
				<ReduxExample />
				<div className="mt-8">
					<ReduxTest />
				</div>
			</div> */}
			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
