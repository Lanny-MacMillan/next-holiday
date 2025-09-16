import { describe, it, expect } from "@jest/globals";
import {
	selectMyHolidays,
	selectSharedHolidays,
	selectAllHolidays,
	HolidayDTO,
} from "@/store/selectors/holidays";

describe("Holiday selectors", () => {
	const mockHolidays: HolidayDTO[] = [
		{
			id: "holiday-1",
			name: "Christmas 2024",
			holidayType: "christmas",
			accountId: "account-1",
			createdBy: "user-1",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
			_visibility: "mine",
		},
		{
			id: "holiday-2",
			name: "New Year 2025",
			holidayType: "new-year",
			accountId: "account-1",
			createdBy: "user-2",
			createdAt: "2024-01-02T00:00:00Z",
			updatedAt: "2024-01-02T00:00:00Z",
			_visibility: "shared",
		},
		{
			id: "holiday-3",
			name: "Birthday Party",
			holidayType: "birthday",
			accountId: "account-1",
			createdBy: "user-1",
			createdAt: "2024-01-03T00:00:00Z",
			updatedAt: "2024-01-03T00:00:00Z",
			_visibility: "mine",
		},
		{
			id: "holiday-4",
			name: "Halloween",
			holidayType: "halloween",
			accountId: "account-1",
			createdBy: "user-3",
			createdAt: "2024-01-04T00:00:00Z",
			updatedAt: "2024-01-04T00:00:00Z",
			_visibility: "shared",
		},
	];

	describe("selectMyHolidays", () => {
		it("should return only holidays with _visibility 'mine'", () => {
			const result = selectMyHolidays(mockHolidays);

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe("holiday-1");
			expect(result[0]._visibility).toBe("mine");
			expect(result[1].id).toBe("holiday-3");
			expect(result[1]._visibility).toBe("mine");
		});

		it("should return empty array when no holidays have _visibility 'mine'", () => {
			const sharedOnlyHolidays = mockHolidays.filter(
				(h) => h._visibility === "shared"
			);
			const result = selectMyHolidays(sharedOnlyHolidays);

			expect(result).toHaveLength(0);
		});

		it("should return empty array when input is empty", () => {
			const result = selectMyHolidays([]);

			expect(result).toHaveLength(0);
		});
	});

	describe("selectSharedHolidays", () => {
		it("should return only holidays with _visibility 'shared'", () => {
			const result = selectSharedHolidays(mockHolidays);

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe("holiday-2");
			expect(result[0]._visibility).toBe("shared");
			expect(result[1].id).toBe("holiday-4");
			expect(result[1]._visibility).toBe("shared");
		});

		it("should return empty array when no holidays have _visibility 'shared'", () => {
			const myOnlyHolidays = mockHolidays.filter(
				(h) => h._visibility === "mine"
			);
			const result = selectSharedHolidays(myOnlyHolidays);

			expect(result).toHaveLength(0);
		});

		it("should return empty array when input is empty", () => {
			const result = selectSharedHolidays([]);

			expect(result).toHaveLength(0);
		});
	});

	describe("selectAllHolidays", () => {
		it("should return all holidays unchanged", () => {
			const result = selectAllHolidays(mockHolidays);

			expect(result).toHaveLength(4);
			expect(result).toEqual(mockHolidays);
		});

		it("should return empty array when input is empty", () => {
			const result = selectAllHolidays([]);

			expect(result).toHaveLength(0);
		});

		it("should return the same reference when input is not empty", () => {
			const result = selectAllHolidays(mockHolidays);

			expect(result).toBe(mockHolidays);
		});
	});

	describe("selector consistency", () => {
		it("should have consistent results when combining selectors", () => {
			const myHolidays = selectMyHolidays(mockHolidays);
			const sharedHolidays = selectSharedHolidays(mockHolidays);
			const allHolidays = selectAllHolidays(mockHolidays);

			// The sum of mine and shared should equal all
			expect(myHolidays.length + sharedHolidays.length).toBe(
				allHolidays.length
			);

			// All holidays should be accounted for
			const allIds = allHolidays.map((h) => h.id).sort();
			const combinedIds = [...myHolidays, ...sharedHolidays]
				.map((h) => h.id)
				.sort();
			expect(allIds).toEqual(combinedIds);
		});

		it("should not have overlapping results between mine and shared", () => {
			const myHolidays = selectMyHolidays(mockHolidays);
			const sharedHolidays = selectSharedHolidays(mockHolidays);

			const myIds = myHolidays.map((h) => h.id);
			const sharedIds = sharedHolidays.map((h) => h.id);

			// No holiday should appear in both lists
			const overlap = myIds.filter((id) => sharedIds.includes(id));
			expect(overlap).toHaveLength(0);
		});
	});
});
