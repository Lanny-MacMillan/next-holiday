/**
 * Utility functions for consistent card drop shadows across the app
 */

import React from 'react';

export interface ShadowOptions {
  isDarkMode?: boolean;
  isGamified?: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
}

/**
 * Get the appropriate drop shadow filter for cards
 */
export const getCardDropShadow = (options: ShadowOptions = {}): string => {
  const { isDarkMode = false, isGamified = false, intensity = 'medium' } = options;

  if (isDarkMode) {
    // Light splash for dark mode
    switch (intensity) {
      case 'light':
        return 'drop-shadow(1px 2px 4px rgba(255, 255, 255, 0.1)) drop-shadow(0px 1px 2px rgba(255, 255, 255, 0.05))';
      case 'medium':
        return 'drop-shadow(2px 3px 6px rgba(255, 255, 255, 0.15)) drop-shadow(0px 2px 4px rgba(255, 255, 255, 0.08))';
      case 'heavy':
        return 'drop-shadow(3px 5px 9px rgba(255, 255, 255, 0.2)) drop-shadow(1px 2px 4px rgba(255, 255, 255, 0.1))';
      default:
        return 'drop-shadow(2px 3px 6px rgba(255, 255, 255, 0.15)) drop-shadow(0px 2px 4px rgba(255, 255, 255, 0.08))';
    }
  } else {
    // Dark shadow for light mode
    switch (intensity) {
      case 'light':
        return 'drop-shadow(1px 2px 4px rgba(0, 0, 0, 0.1)) drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.05))';
      case 'medium':
        return 'drop-shadow(2px 4px 8px rgba(0, 0, 0, 0.15)) drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.08))';
      case 'heavy':
        return isGamified
          ? 'drop-shadow(3px 5px 9px rgba(0, 0, 0, 0.5)) drop-shadow(1px 2px 4px rgba(0, 0, 0, 0.2))'
          : 'drop-shadow(3px 5px 9px rgba(0, 0, 0, 0.25)) drop-shadow(1px 2px 4px rgba(0, 0, 0, 0.1))';
      default:
        return 'drop-shadow(2px 4px 8px rgba(0, 0, 0, 0.15)) drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.08))';
    }
  }
};

/**
 * Get the appropriate CSS filter string for a card component
 */
export const getCardFilter = (options: ShadowOptions = {}): { filter: string } => {
  return {
    filter: getCardDropShadow(options),
  };
};

/**
 * Get complete card styling including shadows and borders for dark mode
 */
export const getCardStyling = (options: ShadowOptions = {}): React.CSSProperties => {
  const { isDarkMode = false, isGamified = false, intensity = 'medium' } = options;

  const baseStyles: React.CSSProperties = {
    filter: getCardDropShadow(options),
  };

  // Apply white borders for gamified mode (both light and dark mode)
  if (isGamified) {
    return {
      ...baseStyles,
      borderTopWidth: '2px',
      borderRightWidth: '2px',
      borderBottomWidth: '2px',
      borderLeftWidth: '2px',
      borderTopStyle: 'solid',
      borderRightStyle: 'solid',
      borderBottomStyle: 'solid',
      borderLeftStyle: 'solid',
      borderTopColor: 'white',
      borderRightColor: 'white',
      borderBottomColor: 'white',
      borderLeftColor: 'white',
    };
  }

  // Dark mode borders for non-gamified cards
  if (isDarkMode) {
    // Add white outline for dark mode to make shadows pop
    const borderIntensityMap = {
      light: {
        width: '1px',
        style: 'solid' as const,
        color: 'rgba(255, 255, 255, 0.1)',
      },
      medium: {
        width: '1px',
        style: 'solid' as const,
        color: 'rgba(255, 255, 255, 0.25)',
      },
      heavy: {
        width: '3px',
        style: 'solid' as const,
        color: 'rgba(255, 255, 255, 1)',
      },
    };

    const borderProps = borderIntensityMap[intensity];

    return {
      ...baseStyles,
      borderTopWidth: borderProps.width,
      borderRightWidth: borderProps.width,
      borderBottomWidth: borderProps.width,
      borderTopStyle: borderProps.style,
      borderRightStyle: borderProps.style,
      borderBottomStyle: borderProps.style,
      borderTopColor: borderProps.color,
      borderRightColor: borderProps.color,
      borderBottomColor: borderProps.color,
    };
  }

  return baseStyles;
};

/**
 * Get Tailwind CSS classes for card shadows (fallback for components that prefer classes)
 */
export const getCardShadowClasses = (options: ShadowOptions = {}): string => {
  const { isDarkMode = false, intensity = 'medium' } = options;

  if (isDarkMode) {
    switch (intensity) {
      case 'light':
        return 'shadow-sm shadow-white/10';
      case 'medium':
        return 'shadow-md shadow-white/20';
      case 'heavy':
        return 'shadow-lg shadow-white/30';
      default:
        return 'shadow-md shadow-white/20';
    }
  } else {
    switch (intensity) {
      case 'light':
        return 'shadow-sm';
      case 'medium':
        return 'shadow-md';
      case 'heavy':
        return 'shadow-lg';
      default:
        return 'shadow-md';
    }
  }
};
