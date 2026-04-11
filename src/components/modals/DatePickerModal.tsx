'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect: (date: string) => void;
  title?: string;
  currentDate?: string;
  onDelete?: () => void;
  defaultDate?: string; // Default date for pre-populating (e.g., for national holidays)
}

// Helper function to convert ISO date to datetime-local format
const toDateTimeLocalFormat = (isoString: string): string => {
  if (!isoString) return '';

  try {
    const date = new Date(isoString);
    // Format: YYYY-MM-DDTHH:MM (datetime-local format)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export default function DatePickerModal({
  isOpen,
  onClose,
  onDateSelect,
  title = 'Set Countdown Date',
  currentDate = '',
  onDelete,
  defaultDate = '',
}: DatePickerModalProps) {
  // Convert dates to datetime-local format
  const formattedCurrentDate = toDateTimeLocalFormat(currentDate);
  const formattedDefaultDate = toDateTimeLocalFormat(defaultDate);

  const [selectedDate, setSelectedDate] = useState(
    formattedCurrentDate || formattedDefaultDate,
  );
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted (for SSR)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset selected date when modal opens or when current/default dates change
  useEffect(() => {
    if (isOpen) {
      const formattedCurrent = toDateTimeLocalFormat(currentDate);
      const formattedDefault = toDateTimeLocalFormat(defaultDate);
      setSelectedDate(formattedCurrent || formattedDefault);
    }
  }, [isOpen, currentDate, defaultDate]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = () => {
    if (selectedDate) {
      onDateSelect(selectedDate);
      onClose();
    }
  };

  const handleCancel = () => {
    const formattedCurrent = toDateTimeLocalFormat(currentDate);
    const formattedDefault = toDateTimeLocalFormat(defaultDate);
    setSelectedDate(formattedCurrent || formattedDefault);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onClose();
    }
  };

  const isEditing = currentDate !== '';
  const buttonText = isEditing
    ? 'Update Countdown'
    : title.includes('Enable')
      ? 'Enable Countdown'
      : 'Set Countdown';

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4"
      style={{
        transform: 'translateZ(0)',
      }}
    >
      <div
        className="card rounded-lg p-4 sm:p-6 max-w-sm mx-auto w-full"
        style={{
          transform: 'translateZ(0)',
        }}
      >
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-lg sm:text-xl"
          >
            ×
          </button>
        </div>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Date & Time
            </label>
            <input
              type="datetime-local"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm sm:text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent [&::-webkit-calendar-picker-indicator]:dark:invert"
              style={{
                maxWidth: '100%',
                boxSizing: 'border-box',
                minWidth: '0',
              }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!selectedDate}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
            >
              {buttonText}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
          </div>
          {isEditing && onDelete && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleDelete}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors text-sm sm:text-base"
              >
                Delete Countdown
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
