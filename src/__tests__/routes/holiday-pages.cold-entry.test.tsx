/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { setupServer } from "msw/node";
import { rest } from "msw";
import { useAuth0 } from "@auth0/auth0-react";
import ChristmasPage from "@/app/christmas/page";
import { api } from "@/store/api";
import homeSlice from "@/store/slices/homeSlice";
import userSlice from "@/store/slices/userSlice";

// Mock Auth0
jest.mock("@auth0/auth0-react");
const mockUseAuth0 = useAuth0 as jest.MockedFunction<typeof useAuth0>;

// Mock MSW server
const server = setupServer();

// Mock data
const mockAuth0User = {
	sub: "auth0|123",
	email: "test@example.com",
	name: "Test User",
	picture: "https://example.com/picture.jpg",
};

const mockHolidayPreferences = [
	{
		holiday: "Christmas",
		holidayId: "christmas-123",
		budget: 500,
		countdownTimer: "2024-12-25T00:00:00Z",
	},
];

const mockGifts = [
	{
		id: "1",
		name: "Gift 1",
		price: 50,
		isCompleted: false,
		holidayId: "christmas-123",
	},
	{
		id: "2",
		name: "Gift 2",
		price: 75,
		isCompleted: true,
		holidayId: "christmas-123",
	},
];

const mockCards = [
	{ id: "1", name: "Card 1", isCompleted: false, holidayId: "christmas-123" },
];

const mockTasks = [
	{ id: "1", title: "Task 1", isCompleted: false, holidayId: "christmas-123" },
];

// Setup MSW handlers
beforeAll(() => {
	server.listen();
});

afterEach(() => {
	server.resetHandlers();
});

afterAll(() => {
	server.close();
});

describe("Holiday Pages Cold Entry", () => {
	let store: ReturnType<typeof configureStore>;
	let fetchSpy: jest.SpyInstance;

	beforeEach(() => {
		// Create a fresh store for each test
		store = configureStore({
			reducer: {
				home: homeSlice,
				user: userSlice,
				api: api.reducer,
			},
			middleware: (getDefaultMiddleware) =>
				getDefaultMiddleware().concat(api.middleware),
		});

		// Mock Auth0
		mockUseAuth0.mockReturnValue({
			user: mockAuth0User,
			isAuthenticated: true,
			isLoading: false,
			error: undefined,
			loginWithRedirect: jest.fn(),
			logout: jest.fn(),
			getAccessTokenSilently: jest.fn(),
			getAccessTokenWithPopup: jest.fn(),
			getIdTokenClaims: jest.fn(),
			loginWithPopup: jest.fn(),
			buildAuthorizeUrl: jest.fn(),
			buildLogoutUrl: jest.fn(),
			handleRedirectCallback: jest.fn(),
		});

		// Spy on fetch to track network calls
		fetchSpy = jest.spyOn(global, "fetch");
	});

	afterEach(() => {
		fetchSpy.mockRestore();
	});

	it("should fetch data exactly once when Redux home data is absent (cold entry)", async () => {
		// Setup MSW to intercept API calls
		server.use(
			rest.get("/api/holidays/christmas-123/gifts", (req, res, ctx) => {
				return res(ctx.json({ success: true, data: mockGifts }));
			}),
			rest.get("/api/holidays/christmas-123/cards", (req, res, ctx) => {
				return res(ctx.json({ success: true, data: mockCards }));
			}),
			rest.get("/api/holidays/christmas-123/tasks", (req, res, ctx) => {
				return res(ctx.json({ success: true, data: mockTasks }));
			})
		);

		// Render with empty Redux state (cold entry)
		render(
			<Provider store={store}>
				<ChristmasPage />
			</Provider>
		);

		// Wait for the component to render and make API calls
		await waitFor(() => {
			expect(screen.getByText("Christmas")).toBeInTheDocument();
		});

		// Verify that exactly one network call was made per resource
		expect(fetchSpy).toHaveBeenCalledWith(
			expect.stringContaining("/api/holidays/christmas-123/gifts"),
			expect.any(Object)
		);
		expect(fetchSpy).toHaveBeenCalledWith(
			expect.stringContaining("/api/holidays/christmas-123/cards"),
			expect.any(Object)
		);
		expect(fetchSpy).toHaveBeenCalledWith(
			expect.stringContaining("/api/holidays/christmas-123/tasks"),
			expect.any(Object)
		);

		// Should have made exactly 3 API calls (gifts, cards, tasks)
		const giftCalls = fetchSpy.mock.calls.filter((call) =>
			call[0].toString().includes("/gifts")
		);
		const cardCalls = fetchSpy.mock.calls.filter((call) =>
			call[0].toString().includes("/cards")
		);
		const taskCalls = fetchSpy.mock.calls.filter((call) =>
			call[0].toString().includes("/tasks")
		);

		expect(giftCalls).toHaveLength(1);
		expect(cardCalls).toHaveLength(1);
		expect(taskCalls).toHaveLength(1);
	});

	it("should not make network calls when Redux home data is present", async () => {
		// Pre-populate Redux store with home data
		store.dispatch({
			type: "home/setHomeData",
			payload: {
				holidayPreferences: mockHolidayPreferences,
				contacts: [],
				user: mockAuth0User,
				account: { id: "account-123" },
				needsUserSetup: false,
				needsHolidaySelection: false,
			},
		});

		// Setup MSW to track calls (but they shouldn't be made)
		server.use(
			rest.get("/api/holidays/christmas-123/gifts", (req, res, ctx) => {
				return res(ctx.json({ success: true, data: mockGifts }));
			}),
			rest.get("/api/holidays/christmas-123/cards", (req, res, ctx) => {
				return res(ctx.json({ success: true, data: mockCards }));
			}),
			rest.get("/api/holidays/christmas-123/tasks", (req, res, ctx) => {
				return res(ctx.json({ success: true, data: mockTasks }));
			})
		);

		// Render with pre-populated Redux state
		render(
			<Provider store={store}>
				<ChristmasPage />
			</Provider>
		);

		// Wait for the component to render
		await waitFor(() => {
			expect(screen.getByText("Christmas")).toBeInTheDocument();
		});

		// Verify that no network calls were made since Redux has the data
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("should handle missing holidayId gracefully", async () => {
		// Mock Auth0 with no user (should result in no holidayId)
		mockUseAuth0.mockReturnValue({
			user: null,
			isAuthenticated: false,
			isLoading: false,
			error: undefined,
			loginWithRedirect: jest.fn(),
			logout: jest.fn(),
			getAccessTokenSilently: jest.fn(),
			getAccessTokenWithPopup: jest.fn(),
			getIdTokenClaims: jest.fn(),
			loginWithPopup: jest.fn(),
			buildAuthorizeUrl: jest.fn(),
			buildLogoutUrl: jest.fn(),
			handleRedirectCallback: jest.fn(),
		});

		// Render with no auth
		render(
			<Provider store={store}>
				<ChristmasPage />
			</Provider>
		);

		// Should not make any network calls
		expect(fetchSpy).not.toHaveBeenCalled();
	});
});
