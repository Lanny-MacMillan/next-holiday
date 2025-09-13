/**
 * @jest-environment jsdom
 */

import { configureStore } from "@reduxjs/toolkit";
import { api } from "@/store/api";
import { renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { ReactNode } from "react";

// Mock data
const mockAuth0User = {
	sub: "auth0|123",
	email: "test@example.com",
	name: "Test User",
	picture: "https://example.com/picture.jpg",
};

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

const mockNewGift = {
	id: "3",
	name: "New Gift",
	price: 100,
	isCompleted: false,
	holidayId: "christmas-123",
};

describe("Mutation Cache Synchronization", () => {
	let store: ReturnType<typeof configureStore>;

	beforeEach(() => {
		store = configureStore({
			reducer: {
				api: api.reducer,
			},
			middleware: (getDefaultMiddleware) =>
				getDefaultMiddleware().concat(api.middleware),
		});
	});

	const wrapper = ({ children }: { children: ReactNode }) => (
		<Provider store={store}>{children}</Provider>
	);

	it("should update RTK Query cache when creating a gift", async () => {
		// First, populate the cache with initial data
		store.dispatch(
			api.util.upsertQueryData(
				"getGifts",
				{ holidayId: "christmas-123", auth0User: mockAuth0User },
				mockGifts
			)
		);

		// Verify initial state
		const initialResult = api.endpoints.getGifts.select({
			holidayId: "christmas-123",
			auth0User: mockAuth0User,
		})(store.getState());
		expect(initialResult.data).toEqual(mockGifts);

		// Mock the create gift mutation response
		const { result } = renderHook(() => api.useCreateGiftMutation(), {
			wrapper,
		});

		const [createGift] = result.current;

		// Mock successful API response
		const mockResponse = { success: true, data: mockNewGift };

		// Simulate the mutation
		await createGift({
			holidayId: "christmas-123",
			payload: mockNewGift,
			auth0User: mockAuth0User,
		}).unwrap();

		// Verify cache was updated with the new gift
		await waitFor(() => {
			const updatedResult = api.endpoints.getGifts.select({
				holidayId: "christmas-123",
				auth0User: mockAuth0User,
			})(store.getState());

			expect(updatedResult.data).toContainEqual(mockNewGift);
			expect(updatedResult.data).toHaveLength(3);
		});
	});

	it("should update RTK Query cache when deleting a gift", async () => {
		// First, populate the cache with initial data
		store.dispatch(
			api.util.upsertQueryData(
				"getGifts",
				{ holidayId: "christmas-123", auth0User: mockAuth0User },
				mockGifts
			)
		);

		// Verify initial state
		const initialResult = api.endpoints.getGifts.select({
			holidayId: "christmas-123",
			auth0User: mockAuth0User,
		})(store.getState());
		expect(initialResult.data).toEqual(mockGifts);

		const { result } = renderHook(() => api.useDeleteGiftMutation(), {
			wrapper,
		});

		const [deleteGift] = result.current;

		// Mock successful deletion
		const mockResponse = { success: true, data: { id: "1" } };

		// Simulate the mutation
		await deleteGift({
			holidayId: "christmas-123",
			giftId: "1",
			auth0User: mockAuth0User,
		}).unwrap();

		// Verify cache was updated (gift removed)
		await waitFor(() => {
			const updatedResult = api.endpoints.getGifts.select({
				holidayId: "christmas-123",
				auth0User: mockAuth0User,
			})(store.getState());

			expect(updatedResult.data).toHaveLength(1);
			expect(updatedResult.data).not.toContainEqual(
				expect.objectContaining({ id: "1" })
			);
		});
	});

	it("should update RTK Query cache when updating a gift", async () => {
		// First, populate the cache with initial data
		store.dispatch(
			api.util.upsertQueryData(
				"getGifts",
				{ holidayId: "christmas-123", auth0User: mockAuth0User },
				mockGifts
			)
		);

		const { result } = renderHook(() => api.useUpdateGiftMutation(), {
			wrapper,
		});

		const [updateGift] = result.current;

		const updatedGift = { ...mockGifts[0], name: "Updated Gift Name" };

		// Simulate the mutation
		await updateGift({
			holidayId: "christmas-123",
			giftId: "1",
			updates: { name: "Updated Gift Name" },
			auth0User: mockAuth0User,
		}).unwrap();

		// Verify cache was updated
		await waitFor(() => {
			const updatedResult = api.endpoints.getGifts.select({
				holidayId: "christmas-123",
				auth0User: mockAuth0User,
			})(store.getState());

			const updatedGiftInCache = updatedResult.data?.find(
				(gift) => gift.id === "1"
			);
			expect(updatedGiftInCache?.name).toBe("Updated Gift Name");
		});
	});

	it("should handle mutation errors gracefully and not update cache", async () => {
		// First, populate the cache with initial data
		store.dispatch(
			api.util.upsertQueryData(
				"getGifts",
				{ holidayId: "christmas-123", auth0User: mockAuth0User },
				mockGifts
			)
		);

		const { result } = renderHook(() => api.useCreateGiftMutation(), {
			wrapper,
		});

		const [createGift] = result.current;

		// Simulate a failed mutation
		try {
			await createGift({
				holidayId: "christmas-123",
				payload: mockNewGift,
				auth0User: mockAuth0User,
			}).unwrap();
		} catch (error) {
			// Expected to fail
		}

		// Verify cache was not updated
		const resultAfterError = api.endpoints.getGifts.select({
			holidayId: "christmas-123",
			auth0User: mockAuth0User,
		})(store.getState());

		expect(resultAfterError.data).toEqual(mockGifts);
		expect(resultAfterError.data).toHaveLength(2);
	});
});
