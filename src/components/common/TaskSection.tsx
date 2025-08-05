import React from "react";

interface TaskSectionProps {
	title: string;
	items: any[];
	isCompleted: boolean;
	emptyMessage: string;
	completedMessage: string;
	renderItem: (item: any) => React.ReactNode;
	cardClassName?: string;
	borderColor?: string;
}

const TaskSection: React.FC<TaskSectionProps> = ({
	title,
	items,
	isCompleted,
	emptyMessage,
	completedMessage,
	renderItem,
	cardClassName = "",
	borderColor = "rgb(var(--color-blue-500))",
}) => {
	const getTitleColor = () => {
		return isCompleted
			? "text-gray-600 dark:text-gray-500"
			: "text-gray-800 dark:text-white";
	};

	const getEmptyMessageColor = () => {
		return isCompleted
			? "text-gray-300 dark:text-gray-600"
			: "text-gray-400 dark:text-gray-500";
	};

	return (
		<div>
			<h2 className={`font-semibold mb-2 ${getTitleColor()}`}>
				{title} ({items.length})
			</h2>
			<div
				className={`card ${cardClassName} rounded shadow`}
				style={{ borderLeft: `4px solid ${borderColor}` }}
			>
				{items.length === 0 ? (
					<div className={`px-4 py-3 ${getEmptyMessageColor()} text-center`}>
						{isCompleted ? completedMessage : emptyMessage}
					</div>
				) : (
					<ul className="divide-y divide-gray-200 dark:divide-gray-700">
						{items.map((item) => renderItem(item))}
					</ul>
				)}
			</div>
		</div>
	);
};

export default TaskSection;
