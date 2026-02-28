"use client";

import UserAvatar from "./UserAvatar";
import { ShareMember } from "@/store/slices/sharesSlice";

interface SharedUserListProps {
	members: ShareMember[];
	maxVisible?: number;
	size?: "xs" | "sm" | "md" | "lg";
	className?: string;
	showSharedIcon?: boolean;
}

export default function SharedUserList({
	members,
	maxVisible = 3,
	size = "sm",
	className = "",
	showSharedIcon = false,
}: SharedUserListProps) {
	const visibleMembers = members.slice(0, maxVisible);
	const remainingCount = Math.max(0, members.length - maxVisible);

	if (members.length === 0) {
		return null;
	}

	return (
		<div className={`flex items-center gap-1 ${className}`}>
			{/* Optional shared icon */}
			{showSharedIcon && (
				<div className="flex items-center mr-1">
					<svg
						className="w-3 h-3 text-blue-600 dark:text-blue-400"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
					</svg>
				</div>
			)}

			{/* Member avatars */}
			<div className="flex gap-1">
				{visibleMembers.map((member, index) => (
					<UserAvatar
						key={member.userId}
						userId={member.userId}
						name={member.name}
						email={member.email}
						picture={member.picture}
						size={size}
						className="ring-2 ring-white dark:ring-gray-800 hover:z-10 transition-transform hover:scale-110"
					/>
				))}

				{/* Additional members indicator */}
				{remainingCount > 0 && (
					<div className="relative inline-block">
						<div
							className={`${
								size === "xs"
									? "w-4 h-4 text-[8px]"
									: size === "sm"
									? "w-6 h-6 text-[10px]"
									: size === "md"
									? "w-8 h-8 text-xs"
									: "w-10 h-10 text-sm"
							} bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800 text-gray-700 dark:text-gray-300 font-medium`}
							title={`${remainingCount} more member${remainingCount !== 1 ? "s" : ""}`}
						>
							+{remainingCount}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}