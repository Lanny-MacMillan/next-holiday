import {
	describe,
	it,
	expect,
	beforeEach,
	afterEach,
	jest,
} from "@jest/globals";
import {
	deleteHolidayData,
	validateHolidayDeletePermission,
} from "@/lib/server/holidays/deleteHolidayData";
import { prisma } from "@/lib/prisma";

// Mock the prisma client
jest.mock("@/lib/prisma", () => ({
	prisma: {
		holiday: {
			findFirst: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
		},
		task: {
			count: jest.fn(),
		},
		gift: {
			count: jest.fn(),
		},
		card: {
			count: jest.fn(),
		},
		budget: {
			count: jest.fn(),
		},
		share: {
			count: jest.fn(),
		},
		kwanzaaPrinciple: {
			count: jest.fn(),
		},
		guestList: {
			count: jest.fn(),
		},
		taskAssignee: {
			count: jest.fn(),
		},
		budgetTransaction: {
			count: jest.fn(),
		},
		shareMember: {
			count: jest.fn(),
		},
		invite: {
			count: jest.fn(),
		},
		account: {
			findFirst: jest.fn(),
		},
	},
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("deleteHolidayData", () => {
	const mockAccountId = "account-123";
	const mockHolidayId = "holiday-456";
	const mockHoliday = {
		id: mockHolidayId,
		name: "Test Holiday",
		accountId: mockAccountId,
	};

	beforeEach(() => {
		// Set feature flag
		process.env.DELETE_HOLIDAY_CASCADE_ENABLED = "true";
		process.env.DELETE_HOLIDAY_ROW_THRESHOLD = "1000";

		// Reset all mocks
		jest.clearAllMocks();
	});

	afterEach(() => {
		// Clean up environment variables
		delete process.env.DELETE_HOLIDAY_CASCADE_ENABLED;
		delete process.env.DELETE_HOLIDAY_ROW_THRESHOLD;
	});

	describe("Feature flag validation", () => {
		it("should throw error when feature flag is not set", async () => {
			delete process.env.DELETE_HOLIDAY_CASCADE_ENABLED;

			const result = await deleteHolidayData({
				accountId: mockAccountId,
				holidayId: mockHolidayId,
			});

			expect(result.error).toBe(
				"Feature flag DELETE_HOLIDAY_CASCADE_ENABLED is not set"
			);
		});

		it("should throw error when accountId is missing", async () => {
			const result = await deleteHolidayData({
				accountId: "",
				holidayId: mockHolidayId,
			});

			expect(result.error).toBe("accountId and holidayId are required");
		});

		it("should throw error when holidayId is missing", async () => {
			const result = await deleteHolidayData({
				accountId: mockAccountId,
				holidayId: "",
			});

			expect(result.error).toBe("accountId and holidayId are required");
		});
	});

	describe("Holiday validation", () => {
		it("should throw error when holiday is not found", async () => {
			mockPrisma.holiday.findFirst.mockResolvedValue(null);

			const result = await deleteHolidayData({
				accountId: mockAccountId,
				holidayId: mockHolidayId,
			});

			expect(result.error).toBe("Holiday not found or access denied");
		});

		it("should throw error when holiday belongs to different account", async () => {
			mockPrisma.holiday.findFirst.mockResolvedValue(null);

			const result = await deleteHolidayData({
				accountId: mockAccountId,
				holidayId: mockHolidayId,
			});

			expect(result.error).toBe("Holiday not found or access denied");
		});
	});

	describe("Dry run functionality", () => {
		beforeEach(() => {
			mockPrisma.holiday.findFirst.mockResolvedValue(mockHoliday);

			// Mock count functions for dry run
			mockPrisma.holiday.count.mockResolvedValue(1);
			mockPrisma.task.count.mockResolvedValue(5);
			mockPrisma.gift.count.mockResolvedValue(3);
			mockPrisma.card.count.mockResolvedValue(2);
			mockPrisma.budget.count.mockResolvedValue(1);
			mockPrisma.share.count.mockResolvedValue(1);
			mockPrisma.kwanzaaPrinciple.count.mockResolvedValue(0);
			mockPrisma.guestList.count.mockResolvedValue(4);
			mockPrisma.taskAssignee.count.mockResolvedValue(2);
			mockPrisma.budgetTransaction.count.mockResolvedValue(3);
			mockPrisma.shareMember.count.mockResolvedValue(1);
			mockPrisma.invite.count.mockResolvedValue(0);
		});

		it("should return accurate counts in dry run mode", async () => {
			const result = await deleteHolidayData({
				accountId: mockAccountId,
				holidayId: mockHolidayId,
				dryRun: true,
			});

			expect(result.dryRun).toBe(true);
			expect(result.totals).toEqual({
				Holiday: 1,
				Task: 5,
				TaskAssignee: 2,
				Gift: 3,
				Card: 2,
				Budget: 1,
				BudgetTransaction: 3,
				Share: 1,
				ShareMember: 1,
				Invite: 0,
				KwanzaaPrinciple: 0,
				GuestList: 4,
			});
			expect(result.holidayName).toBe("Test Holiday");
			expect(result.error).toBeUndefined();
		});

		it("should not perform actual deletion in dry run mode", async () => {
			await deleteHolidayData({
				accountId: mockAccountId,
				holidayId: mockHolidayId,
				dryRun: true,
			});

			expect(mockPrisma.holiday.delete).not.toHaveBeenCalled();
		});
	});

	describe("Threshold validation", () => {
		beforeEach(() => {
			mockPrisma.holiday.findFirst.mockResolvedValue(mockHoliday);
		});

		it("should throw error when total rows exceed threshold", async () => {
			// Mock high counts
			mockPrisma.holiday.count.mockResolvedValue(1);
			mockPrisma.task.count.mockResolvedValue(1000);
			mockPrisma.gift.count.mockResolvedValue(1000);
			mockPrisma.card.count.mockResolvedValue(1000);
			mockPrisma.budget.count.mockResolvedValue(1000);
			mockPrisma.share.count.mockResolvedValue(1000);
			mockPrisma.kwanzaaPrinciple.count.mockResolvedValue(1000);
			mockPrisma.guestList.count.mockResolvedValue(1000);
			mockPrisma.taskAssignee.count.mockResolvedValue(1000);
			mockPrisma.budgetTransaction.count.mockResolvedValue(1000);
			mockPrisma.shareMember.count.mockResolvedValue(1000);
			mockPrisma.invite.count.mockResolvedValue(1000);

			const result = await deleteHolidayData({
				accountId: mockAccountId,
				holidayId: mockHolidayId,
				dryRun: false,
			});

			expect(result.error).toContain("Delete would affect");
			expect(result.error).toContain("Re-run with force=true");
		});

		it("should allow deletion when force is true", async () => {
			// Mock high counts
			mockPrisma.holiday.count.mockResolvedValue(1);
			mockPrisma.task.count.mockResolvedValue(1000);
			mockPrisma.gift.count.mockResolvedValue(1000);
			mockPrisma.card.count.mockResolvedValue(1000);
			mockPrisma.budget.count.mockResolvedValue(1000);
			mockPrisma.share.count.mockResolvedValue(1000);
			mockPrisma.kwanzaaPrinciple.count.mockResolvedValue(1000);
			mockPrisma.guestList.count.mockResolvedValue(1000);
			mockPrisma.taskAssignee.count.mockResolvedValue(1000);
			mockPrisma.budgetTransaction.count.mockResolvedValue(1000);
			mockPrisma.shareMember.count.mockResolvedValue(1000);
			mockPrisma.invite.count.mockResolvedValue(1000);

			mockPrisma.holiday.delete.mockResolvedValue(mockHoliday as any);

			const result = await deleteHolidayData({
				accountId: mockAccountId,
				holidayId: mockHolidayId,
				dryRun: false,
				force: true,
			});

			expect(result.error).toBeUndefined();
			expect(mockPrisma.holiday.delete).toHaveBeenCalledWith({
				where: {
					id: mockHolidayId,
					accountId: mockAccountId,
				},
			});
		});
	});

	describe("Actual deletion", () => {
		beforeEach(() => {
			mockPrisma.holiday.findFirst.mockResolvedValue(mockHoliday);

			// Mock low counts to pass threshold
			mockPrisma.holiday.count.mockResolvedValue(1);
			mockPrisma.task.count.mockResolvedValue(5);
			mockPrisma.gift.count.mockResolvedValue(3);
			mockPrisma.card.count.mockResolvedValue(2);
			mockPrisma.budget.count.mockResolvedValue(1);
			mockPrisma.share.count.mockResolvedValue(1);
			mockPrisma.kwanzaaPrinciple.count.mockResolvedValue(0);
			mockPrisma.guestList.count.mockResolvedValue(4);
			mockPrisma.taskAssignee.count.mockResolvedValue(2);
			mockPrisma.budgetTransaction.count.mockResolvedValue(3);
			mockPrisma.shareMember.count.mockResolvedValue(1);
			mockPrisma.invite.count.mockResolvedValue(0);
		});

		it("should perform actual deletion when not in dry run mode", async () => {
			mockPrisma.holiday.delete.mockResolvedValue(mockHoliday as any);

			const result = await deleteHolidayData({
				accountId: mockAccountId,
				holidayId: mockHolidayId,
				dryRun: false,
			});

			expect(result.dryRun).toBe(false);
			expect(result.error).toBeUndefined();
			expect(mockPrisma.holiday.delete).toHaveBeenCalledWith({
				where: {
					id: mockHolidayId,
					accountId: mockAccountId,
				},
			});
		});

		it("should handle deletion errors gracefully", async () => {
			mockPrisma.holiday.delete.mockRejectedValue(new Error("Database error"));

			const result = await deleteHolidayData({
				accountId: mockAccountId,
				holidayId: mockHolidayId,
				dryRun: false,
			});

			expect(result.error).toBe("Database error");
		});
	});
});

describe("validateHolidayDeletePermission", () => {
	const mockUserId = "user-123";
	const mockHolidayId = "holiday-456";
	const mockHoliday = {
		id: mockHolidayId,
		name: "Test Holiday",
		accountId: "account-123",
		account: {
			id: "account-123",
			name: "Test Account",
			ownerUserId: mockUserId,
		},
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should allow deletion when user is account owner", async () => {
		mockPrisma.holiday.findFirst.mockResolvedValue(mockHoliday as any);

		const result = await validateHolidayDeletePermission(
			mockHolidayId,
			mockUserId
		);

		expect(result.canDelete).toBe(true);
		expect(result.holiday).toEqual(mockHoliday);
		expect(result.error).toBeUndefined();
	});

	it("should allow deletion when user is account member", async () => {
		const holidayWithMember = {
			...mockHoliday,
			account: {
				...mockHoliday.account,
				ownerUserId: "different-user",
				members: [{ userId: mockUserId }],
			},
		};
		mockPrisma.holiday.findFirst.mockResolvedValue(holidayWithMember as any);

		const result = await validateHolidayDeletePermission(
			mockHolidayId,
			mockUserId
		);

		expect(result.canDelete).toBe(true);
		expect(result.holiday).toEqual(holidayWithMember);
	});

	it("should deny deletion when user has no access", async () => {
		mockPrisma.holiday.findFirst.mockResolvedValue(null);

		const result = await validateHolidayDeletePermission(
			mockHolidayId,
			mockUserId
		);

		expect(result.canDelete).toBe(false);
		expect(result.error).toBe("Holiday not found or access denied");
	});

	it("should handle database errors gracefully", async () => {
		mockPrisma.holiday.findFirst.mockRejectedValue(new Error("Database error"));

		const result = await validateHolidayDeletePermission(
			mockHolidayId,
			mockUserId
		);

		expect(result.canDelete).toBe(false);
		expect(result.error).toBe("Failed to validate permissions");
	});
});
