import React from 'react';

interface TaskSectionProps {
  title: string;
  items: any[];
  isCompleted: boolean;
  emptyMessage: string;
  completedMessage: string;
  renderItem: (item: any) => React.ReactNode;
  cardClassName?: string;
  borderColor?: string;
  customTitle?: string; // Optional custom title override
}

const TaskSection: React.FC<TaskSectionProps> = ({
  title,
  items,
  isCompleted,
  emptyMessage,
  completedMessage,
  renderItem,
  cardClassName = '',
  borderColor,
  customTitle,
}) => {
  const getTitleColor = () => {
    return isCompleted
      ? 'text-gray-600 dark:text-gray-500'
      : 'text-gray-800 dark:text-white';
  };

  const getEmptyMessageColor = () => {
    return isCompleted
      ? 'text-gray-300 dark:text-gray-600'
      : 'text-gray-400 dark:text-gray-500';
  };

  return (
    <div>
      <h2 className={`font-semibold mb-2 text-base sm:text-lg ${getTitleColor()}`}>
        {customTitle || title} ({items.length})
      </h2>
      <div
        className={`card ${cardClassName} rounded shadow`}
        style={
          borderColor
            ? {
                borderLeftWidth: '4px',
                borderLeftStyle: 'solid' as const,
                borderLeftColor: borderColor,
              }
            : {}
        }
      >
        {items.length === 0 ? (
          <div
            className={`px-3 py-3 sm:px-4 sm:py-3 ${getEmptyMessageColor()} text-center text-sm sm:text-base`}
          >
            {isCompleted ? completedMessage : emptyMessage}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map(item =>
              React.cloneElement(renderItem(item) as React.ReactElement, {
                key: item.id || item.uuid || Math.random(),
              }),
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TaskSection;
