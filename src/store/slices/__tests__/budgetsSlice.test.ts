import budgetsReducer, {
	selectBudgetByHolidayId,
	selectAllBudgets,
	selectBudgetsLoading,
	selectBudgetsError,
	selectBudgetsInitialized,
	setMany,
	setOne,
	removeOne,
} from "../budgetsSlice";

describe("budgetsSlice", () => {
	const initialState = {
		entities: {},
		loading: false,
		error: null,
		initialized: false,
	};

	const mockBudget = {
		holidayId: "test-holiday-1",
		targetAmount: 500,
		spentAmount: 150,
		updatedAt: "2024-01-01T00:00:00.000Z",
	};

	const mockBudget2 = {
		holidayId: "test-holiday-2",
		targetAmount: 300,
		spentAmount: 75,
		updatedAt: "2024-01-01T00:00:00.000Z",
	};

	describe("reducers", () => {
		it("should return initial state", () => {
			expect(budgetsReducer(undefined, { type: "unknown" })).toEqual(
				initialState
			);
		});

		it("should handle setMany", () => {
			const budgets = [mockBudget, mockBudget2];
			const newState = budgetsReducer(initialState, setMany(budgets));

			expect(newState.entities).toEqual({
				"test-holiday-1": mockBudget,
				"test-holiday-2": mockBudget2,
			});
			expect(newState.initialized).toBe(true);
		});

		it("should handle setOne", () => {
			const newState = budgetsReducer(initialState, setOne(mockBudget));

			expect(newState.entities).toEqual({
				"test-holiday-1": mockBudget,
			});
		});

		it("should handle removeOne", () => {
			const stateWithBudget = {
				...initialState,
				entities: { "test-holiday-1": mockBudget },
			};
			const newState = budgetsReducer(
				stateWithBudget,
				removeOne("test-holiday-1")
			);

			expect(newState.entities).toEqual({});
		});

		it("should handle clearError", () => {
			const stateWithError = {
				...initialState,
				error: "Test error",
			};
			const newState = budgetsReducer(stateWithError, {
				type: "budgets/clearError",
			});

			expect(newState.error).toBe(null);
		});
	});

	describe("selectors", () => {
		const mockState = {
			budgets: {
				entities: {
					"test-holiday-1": mockBudget,
					"test-holiday-2": mockBudget2,
				},
				loading: false,
				error: null,
				initialized: true,
			},
		};

		it("should select budget by holiday ID", () => {
			const result = selectBudgetByHolidayId(mockState, "test-holiday-1");
			expect(result).toEqual(mockBudget);
		});

		it("should return null for non-existent holiday ID", () => {
			const result = selectBudgetByHolidayId(mockState, "non-existent");
			expect(result).toBe(null);
		});

		it("should select all budgets", () => {
			const result = selectAllBudgets(mockState);
			expect(result).toEqual([mockBudget, mockBudget2]);
		});

		it("should select loading state", () => {
			const result = selectBudgetsLoading(mockState);
			expect(result).toBe(false);
		});

		it("should select error state", () => {
			const result = selectBudgetsError(mockState);
			expect(result).toBe(null);
		});

		it("should select initialized state", () => {
			const result = selectBudgetsInitialized(mockState);
			expect(result).toBe(true);
		});
	});
});
