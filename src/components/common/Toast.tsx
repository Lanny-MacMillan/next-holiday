'use client';

import { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
}

export default function Toast({
  message,
  isVisible,
  onClose,
  type = 'success',
}: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      // Different durations based on message type
      const duration = type === 'error' ? 6000 : type === 'info' ? 4000 : 3000;

      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, type]);

  if (!isVisible) return null;

  const bgColor =
    type === 'success'
      ? 'bg-green-500'
      : type === 'error'
        ? 'bg-red-500'
        : 'bg-blue-500';
  const icon = type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ';

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] animate-in slide-in-from-top-2 duration-300">
      <div
        className={`${bgColor} text-white px-4 sm:px-6 py-3 flex items-center space-x-3 w-full shadow-xl border-b border-white/20`}
      >
        <span className="text-lg sm:text-xl font-bold">{icon}</span>
        <span className="flex-1 text-sm sm:text-base font-medium">{message}</span>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors text-lg sm:text-xl font-bold ml-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
