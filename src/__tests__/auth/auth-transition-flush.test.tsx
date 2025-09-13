/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { useAuth0 } from "@auth0/auth0-react";
import AuthWrapper from "@/components/auth/AuthWrapper";
import { api } from "@/store/api";
import homeSlice from "@/store/slices/homeSlice";
import userSlice from "@/store/slices/userSlice";
import themeSlice from "@/store/slices/themeSlice";
import userPreferencesSlice from "@/store/slices/userPreferencesSlice";

// Mock Auth0
jest.mock("@auth0/auth0-react");
const mockUseAuth0 = useAuth0 as jest.MockedFunction<typeof useAuth0>;

// Mock data
const mockUser1 = {
	sub: "auth0|user1",
	email: "user1@example.com",
	name: "User One",
	picture: "https://example.com/user1.jpg",
};

const mockUser2 = {
	sub: "auth0|user2",
	email: "user2@example.com",
	name: "User Two",
	picture: "https://example.com/user2.jpg",
};

const mockHomeData = {
	holidayPreferences: [
		{
			holiday: "Christmas",
			holidayId: "christmas-123",
			budget: 500,
			countdownTimer: "2024-12-25T00:00:00Z",
		},
	],
	contacts: [{ id: "contact-1", name: "John Doe", email: "john@example.com" }],
	user: mockUser1,
	account: { id: "account-123" },
	needsUserSetup: false,
	needsHolidaySelection: false,
};

describe("Auth Transition Cache Flush", () => {
	let store: ReturnType<typeof configureStore>;

	beforeEach(() => {
		store = configureStore({
			reducer: {
				home: homeSlice,
				user: userSlice,
				theme: themeSlice,
				userPreferences: userPreferencesSlice,
				api: api.reducer,
			},
			middleware: (getDefaultMiddleware) =>
				getDefaultMiddleware().concat(api.middleware),
		});
	});

	it("should clear all caches when user logs out", async () => {
		// Pre-populate store with user data
		store.dispatch({
			type: "home/setHomeData",
			payload: mockHomeData,
		});

		store.dispatch({
			type: "user/setUser",
			payload: {
				sub: mockUser1.sub,
				email: mockUser1.email,
				name: mockUser1.name,
				picture: mockUser1.picture,
				isInDb: true,
			},
		});

		// Add some RTK Query cache data
		store.dispatch(
			api.util.upsertQueryData(
				"getGifts",
				{ holidayId: "christmas-123", auth0User: mockUser1 },
				[{ id: "1", name: "Gift 1", holidayId: "christmas-123" }]
			)
		);

		// Verify data is present
		expect(store.getState().home.data).toEqual(mockHomeData);
		expect(store.getState().user.user).toBeTruthy();
		expect(store.getState().api.queries).toBeTruthy();

		// Mock Auth0 logout
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

		// Render AuthWrapper
		render(
			<Provider store={store}>
				<AuthWrapper>
					<div>Test Content</div>
				</AuthWrapper>
			</Provider>
		);

		// Wait for logout effect to run
		await waitFor(() => {
			expect(store.getState().home.data).toBeNull();
			expect(store.getState().user.user).toBeNull();
			expect(store.getState().api.queries).toEqual({});
		});
	});

	it("should clear all caches when user switches accounts", async () => {
		// Pre-populate store with User 1 data
		store.dispatch({
			type: "home/setHomeData",
			payload: mockHomeData,
		});

		store.dispatch({
			type: "user/setUser",
			payload: {
				sub: mockUser1.sub,
				email: mockUser1.email,
				name: mockUser1.name,
				picture: mockUser1.picture,
				isInDb: true,
			},
		});

		// Add some RTK Query cache data for User 1
		store.dispatch(
			api.util.upsertQueryData(
				"getGifts",
				{ holidayId: "christmas-123", auth0User: mockUser1 },
				[{ id: "1", name: "User 1 Gift", holidayId: "christmas-123" }]
			)
		);

		// Verify User 1 data is present
		expect(store.getState().home.data?.user).toEqual(mockUser1);
		expect(store.getState().user.user?.sub).toBe(mockUser1.sub);

		// Mock Auth0 with User 2 (account switch)
		mockUseAuth0.mockReturnValue({
			user: mockUser2,
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

		// Render AuthWrapper
		render(
			<Provider store={store}>
				<AuthWrapper>
					<div>Test Content</div>
				</AuthWrapper>
			</Provider>
		);

		// Wait for user switch effect to run
		await waitFor(() => {
			// All caches should be cleared
			expect(store.getState().home.data).toBeNull();
			expect(store.getState().user.user).toBeNull();
			expect(store.getState().api.queries).toEqual({});
		});
	});

	it("should not clear caches when same user re-authenticates", async () => {
		// Pre-populate store with user data
		store.dispatch({
			type: "home/setHomeData",
			payload: mockHomeData,
		});

		store.dispatch({
			type: "user/setUser",
			payload: {
				sub: mockUser1.sub,
				email: mockUser1.email,
				name: mockUser1.name,
				picture: mockUser1.picture,
				isInDb: true,
			},
		});

		// Add some RTK Query cache data
		store.dispatch(
			api.util.upsertQueryData(
				"getGifts",
				{ holidayId: "christmas-123", auth0User: mockUser1 },
				[{ id: "1", name: "Gift 1", holidayId: "christmas-123" }]
			)
		);

		// Mock Auth0 with same user (re-authentication)
		mockUseAuth0.mockReturnValue({
			user: mockUser1,
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

		// Render AuthWrapper
		render(
			<Provider store={store}>
				<AuthWrapper>
					<div>Test Content</div>
				</AuthWrapper>
			</Provider>
		);

		// Wait a bit to ensure no clearing happens
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Data should still be present (no clearing for same user)
		expect(store.getState().home.data).toEqual(mockHomeData);
		expect(store.getState().user.user?.sub).toBe(mockUser1.sub);
		expect(Object.keys(store.getState().api.queries)).toHaveLength(1);
	});

	it("should handle theme cache clearing correctly", async () => {
		// Pre-populate theme with budget data
		store.dispatch({
			type: "theme/updateSettings",
			payload: {
				holidayChoices: [{ holiday: "Christmas", budget: 500 }],
				giftBudgetLimit: 1000,
			},
		});

		// Verify theme data is present
		expect(store.getState().theme.settings.holidayChoices).toHaveLength(1);
		expect(store.getState().theme.settings.giftBudgetLimit).toBe(1000);

		// Mock Auth0 logout
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

		// Render AuthWrapper
		render(
			<Provider store={store}>
				<AuthWrapper>
					<div>Test Content</div>
				</AuthWrapper>
			</Provider>
		);

		// Wait for logout effect to run
		await waitFor(() => {
			// Budget-related data should be cleared
			expect(store.getState().theme.settings.holidayChoices).toHaveLength(0);
			expect(store.getState().theme.settings.giftBudgetLimit).toBe(0);
		});
	});
});
