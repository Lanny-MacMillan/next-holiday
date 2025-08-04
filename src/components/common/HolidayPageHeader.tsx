import React from "react";
import Link from "next/link";

interface HolidayPageHeaderProps {
	title: string;
	backHref: string;
	onSortClick?: () => void;
	sortTitle?: string;
	error?: string | null;
}

const HolidayPageHeader: React.FC<HolidayPageHeaderProps> = ({
	title,
	backHref,
	onSortClick,
	sortTitle = "Sort",
	error,
}) => {
	return (
		<header className="w-full max-w-md py-6">
			<div className="flex items-center justify-center relative">
				<Link
					href={backHref}
					className="absolute left-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xl"
				>
					←
				</Link>
				<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
					{title}
				</h1>
				{onSortClick && (
					<button
						onClick={onSortClick}
						className="absolute right-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xl"
						title={sortTitle}
					>
						<div className="flex flex-col gap-0.5">
							<div className="w-4 h-0.5 bg-current"></div>
							<div className="w-3 h-0.5 bg-current ml-1"></div>
							<div className="w-2 h-0.5 bg-current ml-2"></div>
						</div>
					</button>
				)}
			</div>
			{error && (
				<div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-2 rounded mb-4">
					{error}
				</div>
			)}
		</header>
	);
};

export default HolidayPageHeader;
