import React, { useState } from 'react';
import { Task } from '@/store/slices/tasksSlice';
import DeleteModal from '@/components/modals/DeleteModal';
import { getDeleteConfig } from '@/config/deleteModalConfigs';
import { useAppSelector } from '@/store/hooks';
import { getCardStyling } from '@/utils/cardShadows';
import { getTaskGamifiedBackgroundColor } from '@/utils/gamifiedUtils';

export interface ToDoCardProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void; // Simplified back to just taskId
  onEdit: (task: Task) => void;
  className?: string;
  theme?: {
    accentColor?: string;
    hoverColor?: string;
  };
  borderColor?: string; // Border color for the left border
  gamified?: boolean; // New prop to control display mode
  gamifiedBackgroundColor?: string; // Optional override for background color
  disableInternalModal?: boolean; // Disable the card's internal delete modal
}

// Task-themed icons for gamified mode
const TaskIcon = ({
  priority,
  className = '',
}: {
  priority: string;
  className?: string;
}) => {
  const iconMap: { [key: string]: string } = {
    high: '🔥',
    medium: '⚡',
    low: '🌱',
  };

  return (
    <div className={`text-xl sm:text-2xl ${className}`}>
      {iconMap[priority] || '📝'}
    </div>
  );
};

export default function ToDoCard({
  task,
  onToggleComplete,
  onDelete,
  onEdit,
  className = '',
  theme = {},
  borderColor,
  gamified = false,
  gamifiedBackgroundColor: propGamifiedBackgroundColor,
  disableInternalModal = false,
}: ToDoCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get display mode from Redux settings and user preferences (fallback to prop)
  const { settings } = useAppSelector((state: any) => state.theme);
  const { preferences } = useAppSelector((state: any) => state.userPreferences);
  const isGamifiedMode =
    gamified ||
    preferences?.displayMode === 'gamified' ||
    settings.displayMode === 'gamified';
  const isDarkMode = preferences?.theme === 'dark' || settings.theme === 'dark';

  const accentColor = theme.accentColor;
  const hoverColor = theme.hoverColor || 'hover:shadow-md';

  // Apply border color if provided
  const borderStyle = borderColor
    ? {
        borderLeftWidth: '4px' as const,
        borderLeftStyle: 'solid' as const,
        borderLeftColor: borderColor,
      }
    : {};

  const handleToggle = () => {
    onToggleComplete(task.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disableInternalModal) {
      // Call the external delete handler directly
      onDelete(task.id);
    } else {
      // Show the internal modal
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    onDelete(task.id);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444'; // red-500
      case 'medium':
        return '#f97316'; // orange-500
      case 'low':
        return '#10b981'; // green-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-white text-red-600 border border-red-200';
      case 'medium':
        return 'bg-white text-orange-600 border border-orange-200';
      case 'low':
        return 'bg-white text-green-600 border border-green-200';
      default:
        return 'bg-white text-gray-600 border border-gray-200';
    }
  };
  const gamifiedBackgroundColor =
    propGamifiedBackgroundColor ||
    (accentColor
      ? getTaskGamifiedBackgroundColor(task.priority) // Use proper task-based colors when theme is provided
      : getTaskGamifiedBackgroundColor(task.priority));

  const formatDate = (dateString: string) => {
    // Handle both date-only strings (YYYY-MM-DD) and ISO timestamps
    if (dateString.includes('T')) {
      // ISO timestamp - extract date part only to avoid timezone issues
      const datePart = dateString.split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString();
    } else {
      // Date-only string - create date without timezone conversion
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString();
    }
  };

  if (isGamifiedMode) {
    // Gamified mode design
    return (
      <div
        className={`relative card rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden ${gamifiedBackgroundColor} text-white ${className}`}
        style={getCardStyling({
          isDarkMode,
          isGamified: true,
          intensity: 'heavy',
        })}
        onClick={handleToggle}
      >
        {/* Priority indicator - 10px wide strip on left side */}
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{
            backgroundColor: getPriorityColor(task.priority),
            width: '10px',
          }}
        ></div>

        {/* Background texture overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-white opacity-20 pointer-events-none"></div>
          <div className="absolute top-8 right-6 w-4 h-4 rounded-full bg-white opacity-15 pointer-events-none"></div>
          <div className="absolute bottom-6 left-8 w-5 h-5 rounded-full bg-white opacity-10 pointer-events-none"></div>
          <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-white opacity-20 pointer-events-none"></div>
        </div>

        {/* Delete Button - Top Right Corner */}
        <div
          className="absolute top-2 right-2 z-50"
          onClick={e => {
            e.stopPropagation();
          }}
        >
          <button
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete(e);
            }}
            className="text-red-700 hover:text-red-900 text-xl sm:text-2xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors cursor-pointer"
            title="Delete task"
            style={{
              pointerEvents: 'auto',
            }}
          >
            <span className="text-2xl sm:text-3xl font-bold select-none">×</span>
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {!disableInternalModal && (
          <DeleteModal
            isOpen={showDeleteConfirm}
            {...getDeleteConfig('tasks')}
            itemName={task.title}
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
          />
        )}

        <div className="relative z-10">
          {/* Main Card Content */}
          <div className="flex items-start space-x-3">
            {/* Task Icon */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
              <TaskIcon priority={task.priority} />
            </div>

            {/* Task Content */}
            <div className="flex-1 min-w-0">
              {/* Task Title */}
              <div
                className={`font-semibold text-white text-sm sm:text-base ${
                  task.isCompleted ? 'line-through opacity-60' : ''
                }`}
              >
                {task.title}
              </div>

              {/* Task Description */}
              {task.description && (
                <>
                  {/* Extract and display description without cost */}
                  {(() => {
                    const costMatch = task.description.match(/Cost: \$(\d+\.?\d*)/);
                    const descriptionWithoutCost = task.description.replace(
                      /\nCost: \$(\d+\.?\d*)/,
                      '',
                    );

                    return (
                      <>
                        {descriptionWithoutCost && (
                          <div
                            className={`text-xs sm:text-sm mt-1 text-white opacity-90 ${
                              task.isCompleted ? 'line-through opacity-60' : ''
                            }`}
                          >
                            {descriptionWithoutCost}
                          </div>
                        )}

                        {/* Display cost separately below description */}
                        {costMatch && (
                          <div
                            className={`text-xs sm:text-sm mt-1 font-medium text-white opacity-90 ${
                              task.isCompleted ? 'line-through opacity-60' : ''
                            }`}
                          >
                            Cost: ${costMatch[1]}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}

              {/* Task Metadata */}
              <div className="flex flex-wrap gap-2 mt-2">
                {/* Priority Tag */}
                <span
                  className="px-2 py-1 rounded-full text-xs sm:text-sm font-medium"
                  style={{
                    color: getPriorityColor(task.priority),
                    backgroundColor: 'white',
                  }}
                >
                  {task.priority} priority
                </span>

                {/* Assigned To Tag */}
                {task.assignedTo && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-white text-blue-600">
                    👤 {task.assignedTo}
                  </span>
                )}

                {/* Due Date */}
                {task.dueDate && !task.isCompleted && (
                  <span className="text-xs text-white opacity-80">
                    Due: {formatDate(task.dueDate)}
                  </span>
                )}

                {/* Completion Date */}
                {task.completedDate && task.isCompleted && (
                  <span className="text-xs text-white opacity-60">
                    Completed: {formatDate(task.completedDate)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Edit Button - Full Bottom Area */}
          <div className="flex flex-col gap-1 mt-3">
            <button
              onClick={handleEdit}
              className="text-white border border-yellow-300 hover:bg-yellow-300 hover:text-white text-xs sm:text-sm px-2 py-1 rounded transition-colors"
              title="Edit task"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Professional mode (existing design)
  return (
    <div
      className={`relative card card-tasks p-3 sm:p-4 cursor-pointer ${hoverColor} transition-shadow ${className}`}
      style={borderStyle}
      onClick={handleToggle}
    >
      {/* Close Button (Red X) */}
      <button
        onClick={e => {
          e.stopPropagation();
          handleDelete(e);
        }}
        className="absolute top-2 right-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-lg font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        title="Delete task"
      >
        ×
      </button>
      {/* Delete Confirmation Modal */}
      {!disableInternalModal && (
        <DeleteModal
          isOpen={showDeleteConfirm}
          {...getDeleteConfig('tasks')}
          itemName={task.title}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {/* Main Card Content */}
      <div className="flex items-start space-x-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={task.isCompleted}
          readOnly
          className="mt-1 mr-3"
          style={{ accentColor }}
        />

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {/* Task Title */}
          <div
            className={`font-semibold text-sm sm:text-base ${
              task.isCompleted
                ? 'line-through text-gray-400 dark:text-gray-500'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {task.title}
          </div>

          {/* Task Description */}
          {task.description && (
            <>
              {/* Extract and display description without cost */}
              {(() => {
                const costMatch = task.description.match(/Cost: \$(\d+\.?\d*)/);
                const descriptionWithoutCost = task.description.replace(
                  /\nCost: \$(\d+\.?\d*)/,
                  '',
                );

                return (
                  <>
                    {descriptionWithoutCost && (
                      <div
                        className={`text-xs sm:text-sm mt-1 ${
                          task.isCompleted
                            ? 'line-through text-gray-400 dark:text-gray-500'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {descriptionWithoutCost}
                      </div>
                    )}

                    {/* Display cost separately below description */}
                    {costMatch && (
                      <div
                        className={`text-xs sm:text-sm mt-1 font-medium ${
                          task.isCompleted
                            ? 'line-through text-gray-400 dark:text-gray-500'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        Cost: ${costMatch[1]}
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}

          {/* Task Metadata */}
          <div className="flex flex-wrap gap-2 mt-2">
            {/* Priority Tag */}
            <span
              className={`px-2 py-1 rounded text-xs sm:text-sm ${getPriorityStyles(
                task.priority,
              )}`}
            >
              {task.priority}
            </span>

            {/* Assigned To Tag */}
            {task.assignedTo && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                👤 {task.assignedTo}
              </span>
            )}

            {/* Category Tag */}
            {task.category && (
              <span className="px-2 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                {task.category}
              </span>
            )}

            {/* Due Date */}
            {task.dueDate && !task.isCompleted && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Due: {formatDate(task.dueDate)}
              </span>
            )}

            {/* Completion Date */}
            {task.completedDate && task.isCompleted && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Completed: {formatDate(task.completedDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Edit Button - Centered on Right Side */}
      <button
        onClick={handleEdit}
        className="absolute top-1/2 right-4 transform -translate-y-1/2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        title="Edit task"
      >
        Edit
      </button>
    </div>
  );
}
