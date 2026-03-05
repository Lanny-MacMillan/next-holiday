import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import BudgetDisplay from '../BudgetDisplay';
import budgetsReducer from '../../../store/slices/budgetsSlice';
import themeReducer from '../../../store/slices/themeSlice';

// Mock the useHolidayBudget hook
jest.mock('../../../hooks/useHolidayBudget', () => ({
  useHolidayBudget: jest.fn(),
}));

const mockUseHolidayBudget =
  require('../../../hooks/useHolidayBudget').useHolidayBudget;

describe('BudgetDisplay', () => {
  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        budgets: budgetsReducer,
        theme: themeReducer,
      },
      preloadedState: initialState,
    });
  };

  const renderWithProvider = (component: React.ReactElement, initialState = {}) => {
    const store = createMockStore(initialState);
    return render(<Provider store={store}>{component}</Provider>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render budget display with DB-backed data', () => {
    // Mock the hook to return DB-backed budget data
    mockUseHolidayBudget.mockReturnValue({
      budget: {
        holidayId: 'christmas-123',
        targetAmount: 500,
        spentAmount: 150,
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      loading: false,
      error: null,
    });

    renderWithProvider(
      <BudgetDisplay
        holiday="Christmas"
        holidayColor="bg-gradient-to-br from-red-400 to-red-600"
        holidayId="christmas-123"
      />,
    );

    // Check that budget information is displayed
    expect(screen.getByText('Christmas Budget')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument(); // Spent amount
    expect(screen.getByText('$350.00')).toBeInTheDocument(); // Remaining amount
    expect(screen.getByText('$500.00')).toBeInTheDocument(); // Budget limit
    expect(screen.getByText('30.0% used')).toBeInTheDocument(); // Percentage
  });

  it('should not render when no budget is set', () => {
    // Mock the hook to return no budget data
    mockUseHolidayBudget.mockReturnValue({
      budget: null,
      loading: false,
      error: null,
    });

    const { container } = renderWithProvider(
      <BudgetDisplay
        holiday="Christmas"
        holidayColor="bg-gradient-to-br from-red-400 to-red-600"
        holidayId="christmas-123"
      />,
    );

    // Should not render anything when no budget is set
    expect(container.firstChild).toBeNull();
  });

  it('should show loading state', () => {
    // Mock the hook to return loading state
    mockUseHolidayBudget.mockReturnValue({
      budget: null,
      loading: true,
      error: null,
    });

    renderWithProvider(
      <BudgetDisplay
        holiday="Christmas"
        holidayColor="bg-gradient-to-br from-red-400 to-red-600"
        holidayId="christmas-123"
      />,
    );

    // Should not render anything when loading
    expect(screen.queryByText('Christmas Budget')).not.toBeInTheDocument();
  });

  it('should show error state', () => {
    // Mock the hook to return error state
    mockUseHolidayBudget.mockReturnValue({
      budget: null,
      loading: false,
      error: 'Failed to load budget',
    });

    renderWithProvider(
      <BudgetDisplay
        holiday="Christmas"
        holidayColor="bg-gradient-to-br from-red-400 to-red-600"
        holidayId="christmas-123"
      />,
    );

    // Should not render anything when there's an error
    expect(screen.queryByText('Christmas Budget')).not.toBeInTheDocument();
  });

  it('should handle over-budget scenario', () => {
    // Mock the hook to return over-budget data
    mockUseHolidayBudget.mockReturnValue({
      budget: {
        holidayId: 'christmas-123',
        targetAmount: 500,
        spentAmount: 600,
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      loading: false,
      error: null,
    });

    renderWithProvider(
      <BudgetDisplay
        holiday="Christmas"
        holidayColor="bg-gradient-to-br from-red-400 to-red-600"
        holidayId="christmas-123"
      />,
    );

    // Check that over-budget information is displayed correctly
    expect(screen.getByText('$600.00')).toBeInTheDocument(); // Spent amount
    expect(screen.getByText('-$100.00')).toBeInTheDocument(); // Negative remaining amount
    expect(screen.getByText('120.0% used')).toBeInTheDocument(); // Over 100% used
  });
});
