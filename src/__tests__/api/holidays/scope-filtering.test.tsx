import {
	describe,
	it,
	expect,
	beforeEach,
	afterEach,
	jest,
} from "@jest/globals";
import { GET } from "@/app/api/holidays/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

// Mock the auth module
jest.mock("@/lib/auth", () => ({
	requireAuth: jest.fn(),
}));

// Mock the prisma client
jest.mock("@/lib/prisma", () => ({
	prisma: {
		holiday: {
			findMany: jest.fn(),
			count: jest.fn(),
		},
	},
}));

describe("/api/holidays scope filtering", () => {
	const mockUser1 = {
		id: "user-1",
		email: "user1@example.com",
		name: "User One",
	};

	const mockUser2 = {
		id: "user-2",
		email: "user2@example.com",
		name: "User Two",
	};

	const mockAccount = {
		id: "account-1",
		name: "Test Account",
	};

	const mockHoliday1 = {
		id: "holiday-1",
		name: "Christmas 2024",
		holidayType: "christmas",
		accountId: mockAccount.id,
		createdBy: mockUser1.id,
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
	};

	const mockHoliday2 = {
		id: "holiday-2",
		name: "New Year 2025",
		holidayType: "new-year",
		accountId: mockAccount.id,
		createdBy: mockUser2.id,
		createdAt: new Date("2024-01-02"),
		updatedAt: new Date("2024-01-02"),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe("scope=mine", () => {
		it("should return only holidays created by the current user", async () => {
			const { requireAuth } = await import("@/lib/auth");
			requireAuth.mockResolvedValue(mockUser1);

			prisma.holiday.findMany.mockResolvedValue([mockHoliday1]);

			const request = new NextRequest(
				"http://localhost:3000/api/holidays?scope=mine"
			);
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.data).toHaveLength(1);
			expect(data.data[0]).toEqual({
				...mockHoliday1,
				_visibility: "mine",
			});

			// Verify the query was called with correct where clause
			expect(prisma.holiday.findMany).toHaveBeenCalledWith({
				where: expect.objectContaining({
					createdBy: mockUser1.id,
				}),
				orderBy: [{ createdAt: "desc" }],
				select: {
					id: true,
					name: true,
					holidayType: true,
					accountId: true,
					createdBy: true,
					createdAt: true,
					updatedAt: true,
				},
			});
		});
	});

	describe("scope=shared", () => {
		it("should return only holidays created by other users", async () => {
			const { requireAuth } = await import("@/lib/auth");
			requireAuth.mockResolvedValue(mockUser1);

			prisma.holiday.findMany.mockResolvedValue([mockHoliday2]);

			const request = new NextRequest(
				"http://localhost:3000/api/holidays?scope=shared"
			);
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.data).toHaveLength(1);
			expect(data.data[0]).toEqual({
				...mockHoliday2,
				_visibility: "shared",
			});

			// Verify the query was called with correct where clause
			expect(prisma.holiday.findMany).toHaveBeenCalledWith({
				where: expect.objectContaining({
					createdBy: { not: mockUser1.id },
				}),
				orderBy: [{ createdAt: "desc" }],
				select: {
					id: true,
					name: true,
					holidayType: true,
					accountId: true,
					createdBy: true,
					createdAt: true,
					updatedAt: true,
				},
			});
		});
	});

	describe("scope=all", () => {
		it("should return all holidays with correct visibility annotation", async () => {
			const { requireAuth } = await import("@/lib/auth");
			requireAuth.mockResolvedValue(mockUser1);

			prisma.holiday.findMany.mockResolvedValue([mockHoliday1, mockHoliday2]);

			const request = new NextRequest(
				"http://localhost:3000/api/holidays?scope=all"
			);
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.data).toHaveLength(2);

			// Check that visibility is correctly annotated
			const myHoliday = data.data.find((h: any) => h.id === mockHoliday1.id);
			const sharedHoliday = data.data.find(
				(h: any) => h.id === mockHoliday2.id
			);

			expect(myHoliday._visibility).toBe("mine");
			expect(sharedHoliday._visibility).toBe("shared");

			// Verify the query was called without createdBy filter
			expect(prisma.holiday.findMany).toHaveBeenCalledWith({
				where: expect.not.objectContaining({
					createdBy: expect.anything(),
				}),
				orderBy: [{ createdAt: "desc" }],
				select: {
					id: true,
					name: true,
					holidayType: true,
					accountId: true,
					createdBy: true,
					createdAt: true,
					updatedAt: true,
				},
			});
		});
	});

	describe("default scope", () => {
		it("should default to 'all' when no scope is provided", async () => {
			const { requireAuth } = await import("@/lib/auth");
			requireAuth.mockResolvedValue(mockUser1);

			prisma.holiday.findMany.mockResolvedValue([mockHoliday1, mockHoliday2]);

			const request = new NextRequest("http://localhost:3000/api/holidays");
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.data).toHaveLength(2);

			// Verify the query was called without createdBy filter (default to 'all')
			expect(prisma.holiday.findMany).toHaveBeenCalledWith({
				where: expect.not.objectContaining({
					createdBy: expect.anything(),
				}),
				orderBy: [{ createdAt: "desc" }],
				select: {
					id: true,
					name: true,
					holidayType: true,
					accountId: true,
					createdBy: true,
					createdAt: true,
					updatedAt: true,
				},
			});
		});
	});

	describe("invalid scope", () => {
		it("should return 400 for invalid scope values", async () => {
			const { requireAuth } = await import("@/lib/auth");
			requireAuth.mockResolvedValue(mockUser1);

			const request = new NextRequest(
				"http://localhost:3000/api/holidays?scope=invalid"
			);
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data).toHaveProperty("issues");
			expect(prisma.holiday.findMany).not.toHaveBeenCalled();
		});
	});

	describe("combined with other filters", () => {
		it("should work with accountId filter", async () => {
			const { requireAuth } = await import("@/lib/auth");
			requireAuth.mockResolvedValue(mockUser1);

			prisma.holiday.findMany.mockResolvedValue([mockHoliday1]);

			const request = new NextRequest(
				"http://localhost:3000/api/holidays?scope=mine&accountId=account-1"
			);
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);

			// Verify the query includes both scope and accountId filters
			expect(prisma.holiday.findMany).toHaveBeenCalledWith({
				where: expect.objectContaining({
					createdBy: mockUser1.id,
					accountId: "account-1",
				}),
				orderBy: [{ createdAt: "desc" }],
				select: {
					id: true,
					name: true,
					holidayType: true,
					accountId: true,
					createdBy: true,
					createdAt: true,
					updatedAt: true,
				},
			});
		});
	});
});
