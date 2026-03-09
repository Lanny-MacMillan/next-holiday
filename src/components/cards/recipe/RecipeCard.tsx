import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { getCardStyling } from '@/utils/cardShadows';

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients?: string[];
  instructions?: string[];
  cookTime?: string;
  prepTime?: string;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  isCompleted: boolean;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeCardProps {
  recipe: Recipe;
  isCompleted?: boolean;
  onToggle: (recipeId: string) => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipeId: string) => void;
  loading?: boolean;
  theme?: {
    accentColor?: string;
    hoverColor?: string;
  };
  borderColor?: string;
  gamified?: boolean; // New prop to control display mode
  holidayColor?: string; // New prop for holiday background color
}

// Recipe-themed icons for gamified mode
const RecipeIcon = ({
  difficulty,
  className = '',
}: {
  difficulty?: 'easy' | 'medium' | 'hard';
  className?: string;
}) => {
  const getIcon = (difficulty?: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy':
        return '🥄';
      case 'medium':
        return '🍳';
      case 'hard':
        return '👨‍🍳';
      default:
        return '🍽️';
    }
  };

  return (
    <div className={`text-xl sm:text-2xl ${className}`}>{getIcon(difficulty)}</div>
  );
};

export default function RecipeCard({
  recipe,
  isCompleted = false,
  onToggle,
  onEdit,
  onDelete,
  loading = false,
  theme = {},
  borderColor,
  gamified = false,
  holidayColor,
}: RecipeCardProps) {
  // Get display mode from Redux settings and user preferences (fallback to prop)
  const { settings } = useAppSelector((state: any) => state.theme);
  const { preferences } = useAppSelector((state: any) => state.userPreferences);
  const isGamifiedMode =
    gamified ||
    preferences?.displayMode === 'gamified' ||
    settings.displayMode === 'gamified';
  const isDarkMode = preferences?.theme === 'dark' || settings.theme === 'dark';

  const accentColor = theme.accentColor;
  const hoverColor =
    theme.hoverColor || 'hover:bg-orange-50 dark:hover:bg-orange-900/20';

  const baseClasses = `flex items-center px-3 py-3 sm:px-4 sm:py-3 cursor-pointer ${hoverColor}`;
  const completedClasses = isCompleted ? 'opacity-60' : '';

  // Apply border color if provided
  const borderStyle = borderColor
    ? {
        borderLeftWidth: '4px',
        borderLeftStyle: 'solid' as const,
        borderLeftColor: borderColor,
      }
    : {};

  const backgroundColor =
    holidayColor || 'bg-gradient-to-br from-amber-400 to-amber-600';

  if (isGamifiedMode) {
    // Gamified mode design
    return (
      <li
        key={recipe.id}
        className={`relative card rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden ${backgroundColor} text-white tracking-wide border-2 border-white ${completedClasses}`}
        style={getCardStyling({
          isDarkMode,
          isGamified: true,
          intensity: 'heavy',
        })}
        onClick={() => onToggle(recipe.id)}
      >
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
              onDelete(recipe.id);
            }}
            className="text-red-700 hover:text-red-900 text-xl sm:text-2xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors cursor-pointer"
            title="Delete recipe"
            style={{
              pointerEvents: 'auto',
            }}
          >
            <span className="text-2xl sm:text-3xl font-bold select-none">×</span>
          </button>
        </div>

        <div className="relative z-10">
          <div className="flex items-start space-x-3">
            {/* Recipe Icon */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
              <RecipeIcon difficulty={recipe.difficulty} />
            </div>

            {/* Recipe Content */}
            <div
              className="flex-1 min-w-0"
              style={{ fontFamily: 'var(--font-family-fredoka)' }}
            >
              <div
                className={`font-semibold text-white text-sm sm:text-base ${
                  isCompleted ? 'line-through opacity-60' : ''
                }`}
              >
                {recipe.title}
              </div>
              {recipe.description && (
                <div
                  className={`text-xs sm:text-sm text-white opacity-90 ${
                    isCompleted ? 'line-through opacity-60' : ''
                  }`}
                >
                  {recipe.description}
                </div>
              )}
              <div className="flex gap-2 sm:gap-4 text-xs text-white opacity-80 mt-1">
                {recipe.cookTime && <span>🍳 {recipe.cookTime}</span>}
                {recipe.prepTime && <span>🕒 {recipe.prepTime}</span>}
                {recipe.servings && <span>👥 {recipe.servings} servings</span>}
                {recipe.difficulty && (
                  <span>
                    {recipe.difficulty === 'easy' && '🟢 Easy'}
                    {recipe.difficulty === 'medium' && '🟡 Medium'}
                    {recipe.difficulty === 'hard' && '🔴 Hard'}
                  </span>
                )}
              </div>
              {recipe.category && (
                <div
                  className={`text-xs mt-1 text-white opacity-90 ${
                    isCompleted ? 'line-through opacity-60' : ''
                  }`}
                >
                  Category: {recipe.category}
                </div>
              )}
              {recipe.completedDate && isCompleted && (
                <div className="text-xs text-green-200 mt-1">
                  Completed: {new Date(recipe.completedDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 mt-3">
            <button
              onClick={e => {
                e.stopPropagation();
                onEdit(recipe);
              }}
              className="text-white border border-yellow-300 hover:bg-yellow-300 hover:text-white text-xs sm:text-sm px-2 py-1 rounded transition-colors"
              disabled={loading}
            >
              Edit
            </button>
          </div>
        </div>
      </li>
    );
  }

  // Professional mode (existing design)
  return (
    <li
      key={recipe.id}
      className={`${baseClasses} ${completedClasses}`}
      style={borderStyle}
      onClick={() => onToggle(recipe.id)}
    >
      <input
        type="checkbox"
        checked={recipe.isCompleted}
        readOnly
        className="mr-3"
        style={{ accentColor }}
      />
      <div className="flex-1">
        <div
          className={`text-sm sm:text-base ${
            isCompleted
              ? 'line-through text-gray-400 dark:text-gray-500'
              : 'text-gray-900 dark:text-white'
          }`}
        >
          {recipe.title}
        </div>
        {recipe.description && (
          <div
            className={`text-xs sm:text-sm ${
              isCompleted
                ? 'text-gray-400 dark:text-gray-500 line-through'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {recipe.description}
          </div>
        )}
        <div className="flex gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
          {recipe.cookTime && <span>🍳 {recipe.cookTime}</span>}
          {recipe.prepTime && <span>🕒 {recipe.prepTime}</span>}
          {recipe.servings && <span>👥 {recipe.servings} servings</span>}
          {recipe.difficulty && (
            <span>
              {recipe.difficulty === 'easy' && '🟢 Easy'}
              {recipe.difficulty === 'medium' && '🟡 Medium'}
              {recipe.difficulty === 'hard' && '🔴 Hard'}
            </span>
          )}
        </div>
        {recipe.category && (
          <div
            className={`text-xs mt-1 ${
              isCompleted
                ? 'text-gray-400 dark:text-gray-500 line-through'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Category: {recipe.category}
          </div>
        )}
        {recipe.completedDate && isCompleted && (
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            Completed: {new Date(recipe.completedDate).toLocaleDateString()}
          </div>
        )}
      </div>
      <div className="flex items-center justify-center">
        <button
          onClick={e => {
            e.stopPropagation();
            onEdit(recipe);
          }}
          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs sm:text-sm"
          disabled={loading}
        >
          Edit
        </button>
      </div>
      <button
        onClick={e => {
          e.stopPropagation();
          onDelete(recipe.id);
        }}
        className="absolute top-2 right-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-lg font-bold"
        disabled={loading}
        title="Delete recipe"
      >
        ×
      </button>
    </li>
  );
}
