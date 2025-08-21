import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
	reducerPath: "api",
	baseQuery: fetchBaseQuery({
		baseUrl: "/api",
		credentials: "include",
	}),
	tagTypes: ["Tasks", "Gifts", "Cards", "GuestList"],
	endpoints: (builder) => ({
		// Query endpoints
		getGifts: builder.query<any[], { holidayId: string; auth0User?: any }>({
			query: ({ holidayId, auth0User }) => ({
				url: `holidays/${holidayId}/gifts`,
				headers: auth0User
					? {
							"x-test-user": JSON.stringify({
								sub: auth0User.sub,
								email: auth0User.email,
								name: auth0User.name,
								picture: auth0User.picture,
							}),
					  }
					: {},
			}),
			transformResponse: (response: { success: boolean; data: any[] }) => {
				return response.data || [];
			},
			providesTags: (result, error, { holidayId }) => [
				{ type: "Gifts", id: holidayId },
			],
		}),
		getCards: builder.query<any[], { holidayId: string; auth0User?: any }>({
			query: ({ holidayId, auth0User }) => ({
				url: `holidays/${holidayId}/cards`,
				headers: auth0User
					? {
							"x-test-user": JSON.stringify({
								sub: auth0User.sub,
								email: auth0User.email,
								name: auth0User.name,
								picture: auth0User.picture,
							}),
					  }
					: {},
			}),
			transformResponse: (response: { success: boolean; data: any[] }) => {
				return response.data || [];
			},
			providesTags: (result, error, { holidayId }) => [
				{ type: "Cards", id: holidayId },
			],
		}),
		getTasks: builder.query<any[], { holidayId: string; auth0User?: any }>({
			query: ({ holidayId, auth0User }) => ({
				url: `holidays/${holidayId}/tasks`,
				headers: auth0User
					? {
							"x-test-user": JSON.stringify({
								sub: auth0User.sub,
								email: auth0User.email,
								name: auth0User.name,
								picture: auth0User.picture,
							}),
					  }
					: {},
			}),
			transformResponse: (response: { success: boolean; data: any[] }) => {
				return response.data || [];
			},
			providesTags: (result, error, { holidayId }) => [
				{ type: "Tasks", id: holidayId },
			],
		}),
		getGuestList: builder.query<any[], { holidayId: string; auth0User?: any }>({
			query: ({ holidayId, auth0User }) => ({
				url: `holidays/${holidayId}/guest-lists`,
				headers: auth0User
					? {
							"x-test-user": JSON.stringify({
								sub: auth0User.sub,
								email: auth0User.email,
								name: auth0User.name,
								picture: auth0User.picture,
							}),
					  }
					: {},
			}),
			transformResponse: (response: { success: boolean; data: any[] }) => {
				return response.data || [];
			},
			providesTags: (result, error, { holidayId }) => [
				{ type: "GuestList", id: holidayId },
			],
		}),
		createTask: builder.mutation<
			any,
			{ holidayId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/tasks`,
				method: "POST",
				body: payload,
				headers: auth0User
					? {
							"x-test-user": JSON.stringify({
								sub: auth0User.sub,
								email: auth0User.email,
								name: auth0User.name,
								picture: auth0User.picture,
							}),
					  }
					: {},
			}),
			invalidatesTags: (result, error, { holidayId }) => [
				{ type: "Tasks", id: holidayId },
			],
		}),
		createGift: builder.mutation<
			any,
			{ holidayId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/gifts`,
				method: "POST",
				body: payload,
				headers: auth0User
					? {
							"x-test-user": JSON.stringify({
								sub: auth0User.sub,
								email: auth0User.email,
								name: auth0User.name,
								picture: auth0User.picture,
							}),
					  }
					: {},
			}),
			invalidatesTags: (result, error, { holidayId }) => [
				{ type: "Gifts", id: holidayId },
			],
		}),
		createCard: builder.mutation<
			any,
			{ holidayId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/cards`,
				method: "POST",
				body: payload,
				headers: auth0User
					? {
							"x-test-user": JSON.stringify({
								sub: auth0User.sub,
								email: auth0User.email,
								name: auth0User.name,
								picture: auth0User.picture,
							}),
					  }
					: {},
			}),
			invalidatesTags: (result, error, { holidayId }) => [
				{ type: "Cards", id: holidayId },
			],
		}),
		createGuest: builder.mutation<
			any,
			{ holidayId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/guest-lists`,
				method: "POST",
				body: payload,
				headers: auth0User
					? {
							"x-test-user": JSON.stringify({
								sub: auth0User.sub,
								email: auth0User.email,
								name: auth0User.name,
								picture: auth0User.picture,
							}),
					  }
					: {},
			}),
			invalidatesTags: (result, error, { holidayId }) => [
				{ type: "GuestList", id: holidayId },
			],
		}),
		updateGift: builder.mutation<
			any,
			{
				holidayId: string;
				giftId: string;
				isCompleted: boolean;
				auth0User?: any;
			}
		>({
			query: ({ holidayId, giftId, isCompleted, auth0User }) => ({
				url: `holidays/${holidayId}/gifts`,
				method: "PUT",
				body: { giftId, isCompleted },
				headers: auth0User
					? {
							"x-test-user": JSON.stringify({
								sub: auth0User.sub,
								email: auth0User.email,
								name: auth0User.name,
								picture: auth0User.picture,
							}),
					  }
					: {},
			}),
			invalidatesTags: (result, error, { holidayId }) => [
				{ type: "Gifts", id: holidayId },
			],
		}),
		editGift: builder.mutation<
			any,
			{ holidayId: string; giftId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, giftId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/gifts`,
				method: "PATCH",
				body: { giftId, ...payload },
				headers: auth0User
					? {
							"x-test-user": JSON.stringify({
								sub: auth0User.sub,
								email: auth0User.email,
								name: auth0User.name,
								picture: auth0User.picture,
							}),
					  }
					: {},
			}),
			invalidatesTags: (result, error, { holidayId }) => [
				{ type: "Gifts", id: holidayId },
			],
		}),
		deleteGift: builder.mutation<
			any,
			{ holidayId: string; giftId: string; auth0User?: any }
		>({
			query: ({ holidayId, giftId, auth0User }) => ({
				url: `holidays/${holidayId}/gifts?giftId=${giftId}`,
				method: "DELETE",
				headers: auth0User
					? {
							"x-test-user": JSON.stringify({
								sub: auth0User.sub,
								email: auth0User.email,
								name: auth0User.name,
								picture: auth0User.picture,
							}),
					  }
					: {},
			}),
			// Use optimistic update to immediately remove the item from the cache
			async onQueryStarted(
				{ holidayId, giftId, auth0User },
				{ dispatch, queryFulfilled }
			) {
				console.log(
					"Delete optimistic update - holidayId:",
					holidayId,
					"giftId:",
					giftId
				);

				// Optimistically update the cache by removing the deleted gift
				// Use the same parameters as the query to match the cache key
				const patchResult = dispatch(
					api.util.updateQueryData(
						"getGifts",
						{ holidayId, auth0User },
						(draft) => {
							console.log("UpdateQueryData callback - draft:", draft);
							if (draft) {
								const index = draft.findIndex(
									(gift: any) => gift.id === giftId
								);
								console.log("Found gift at index:", index);
								if (index !== -1) {
									draft.splice(index, 1);
									console.log("Removed gift from cache");
								} else {
									console.log("Gift not found in cache");
								}
							} else {
								console.log("No draft found - query data not available");
							}
						}
					)
				);

				try {
					await queryFulfilled;
					console.log("Delete query fulfilled successfully");
				} catch (error) {
					console.log(
						"Delete query failed, reverting optimistic update:",
						error
					);
					// If the delete fails, revert the optimistic update
					patchResult.undo();
				}
			},
		}),
	}),
});

export const {
	useCreateTaskMutation,
	useCreateGiftMutation,
	useCreateCardMutation,
	useCreateGuestMutation,
	useUpdateGiftMutation,
	useEditGiftMutation,
	useDeleteGiftMutation,
	useGetGiftsQuery,
	useGetCardsQuery,
	useGetTasksQuery,
	useGetGuestListQuery,
} = api;
