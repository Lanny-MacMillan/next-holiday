import { useAppSelector } from '@/store/hooks';
import {
  selectBudgetByHolidayId,
  selectBudgetsLoading,
  selectBudgetsError,
} from '@/store/slices/budgetsSlice';

interface UseHolidayBudgetArgs {
  holidayId?: string;
  slug?: string;
}

interface UseHolidayBudgetReturn {
  budget: {
    holidayId: string;
    targetAmount: number | null;
    spentAmount?: number;
    updatedAt: string;
  } | null;
  loading: boolean;
  error: string | null;
}

export function useHolidayBudget(
  args: UseHolidayBudgetArgs,
): UseHolidayBudgetReturn {
  const { holidayId, slug } = args;

  // For now, we require holidayId since we don't have a holidays slice yet
  // TODO: Update this when we have a holidays slice to resolve slug -> holidayId
  if (!holidayId) {
    console.warn(
      'useHolidayBudget: holidayId is required. slug resolution not yet implemented.',
    );
    return {
      budget: null,
      loading: false,
      error: 'holidayId is required',
    };
  }

  const budget = useAppSelector(state => selectBudgetByHolidayId(state, holidayId));
  const loading = useAppSelector(selectBudgetsLoading);
  const error = useAppSelector(selectBudgetsError);

  return {
    budget,
    loading,
    error,
  };
}

// Development-only warning utility
if (process.env.NODE_ENV === 'development') {
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    if (args[0]?.includes?.('budget') && !args[0]?.includes?.('useHolidayBudget')) {
      originalConsoleWarn(
        '⚠️  Budget accessed outside of useHolidayBudget hook. Please use the centralized budget hook instead.',
        ...args,
      );
    }
    originalConsoleWarn(...args);
  };
}
