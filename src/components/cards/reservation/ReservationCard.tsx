import React from 'react';

interface ReservationCardProps {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  notes?: string;
  onToggleCompletion: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: any) => void;
}

const ReservationCard: React.FC<ReservationCardProps> = ({
  id,
  title,
  description,
  dueDate,
  priority,
  isCompleted,
  notes,
  onToggleCompletion,
  onDelete,
  onEdit,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div
      className={`card card-valentines rounded-2xl p-3 sm:p-4 transition-all ${
        isCompleted ? 'opacity-75' : ''
      }`}
    >
      {/* Header with title and badges */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <h3
            className={`font-bold text-gray-800 dark:text-white text-sm sm:text-lg ${
              isCompleted ? 'line-through' : ''
            }`}
          >
            {title}
          </h3>
          <span
            className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(
              priority,
            )}`}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </span>
          {isCompleted && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Confirmed
            </span>
          )}
        </div>
      </div>

      {/* Details section */}
      <div className="mb-4 space-y-2">
        {description && (
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
            {description}
          </p>
        )}
        {notes && (
          <p className="text-gray-500 dark:text-gray-500 text-xs sm:text-sm italic">
            {notes}
          </p>
        )}
        {dueDate && (
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
            Due: {new Date(dueDate).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Action buttons at bottom */}
      <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onToggleCompletion(id)}
          className="flex-1 px-2 py-2 sm:px-3 sm:py-2 rounded text-xs sm:text-sm font-medium transition-all duration-200 border border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
        >
          {isCompleted ? 'Confirmed' : 'Mark Confirmed'}
        </button>
        {onEdit && (
          <button
            onClick={() =>
              onEdit({
                id,
                title,
                description,
                dueDate,
                priority,
                isCompleted,
                notes,
              })
            }
            className="flex-1 px-2 py-2 sm:px-3 sm:py-2 bg-blue-500 text-white rounded text-xs sm:text-sm font-medium transition-colors hover:bg-blue-600"
          >
            Edit
          </button>
        )}
        <button
          onClick={() =>
            onDelete({
              id,
              title,
              description,
              dueDate,
              priority,
              isCompleted,
              notes,
            })
          }
          className="flex-1 px-2 py-2 sm:px-3 sm:py-2 bg-red-500 text-white rounded text-xs sm:text-sm font-medium transition-colors hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default ReservationCard;
