import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
	reducerPath: "api",
	baseQuery: fetchBaseQuery({
		baseUrl: "/api",
		credentials: "include",
	}),
	tagTypes: ["Tasks", "Gifts", "Cards", "GuestList", "Decorations"],
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
		getDecorations: builder.query<
			any[],
			{ holidayId: string; auth0User?: any }
		>({
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
				// Filter for decorations category
				const allTasks = response.data || [];
				return allTasks.filter((task: any) => task.category === "Decorations");
			},
			providesTags: (result, error, { holidayId }) => [
				{ type: "Decorations", id: holidayId },
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
		createDecoration: builder.mutation<
			any,
			{ holidayId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/tasks`,
				method: "POST",
				body: { ...payload, category: "Decorations" },
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
				{ type: "Decorations", id: holidayId },
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
		updateDecoration: builder.mutation<
			any,
			{
				holidayId: string;
				taskId: string;
				isCompleted: boolean;
				auth0User?: any;
			}
		>({
			query: ({ holidayId, taskId, isCompleted, auth0User }) => ({
				url: `holidays/${holidayId}/tasks`,
				method: "PUT",
				body: { taskId, isCompleted },
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
				{ type: "Decorations", id: holidayId },
			],
		}),
		editDecoration: builder.mutation<
			any,
			{ holidayId: string; taskId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, taskId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/tasks`,
				method: "PATCH",
				body: { taskId, ...payload },
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
				{ type: "Decorations", id: holidayId },
			],
		}),
		deleteDecoration: builder.mutation<
			any,
			{ holidayId: string; taskId: string; auth0User?: any }
		>({
			query: ({ holidayId, taskId, auth0User }) => ({
				url: `holidays/${holidayId}/tasks?taskId=${taskId}`,
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
				{ holidayId, taskId, auth0User },
				{ dispatch, queryFulfilled }
			) {
				console.log(
					"Delete decoration optimistic update - holidayId:",
					holidayId,
					"taskId:",
					taskId
				);

				// Optimistically update the cache by removing the deleted decoration
				const patchResult = dispatch(
					api.util.updateQueryData(
						"getDecorations",
						{ holidayId, auth0User },
						(draft) => {
							console.log("UpdateQueryData callback - draft:", draft);
							if (draft) {
								const index = draft.findIndex(
									(decoration: any) => decoration.id === taskId
								);
								console.log("Found decoration at index:", index);
								if (index !== -1) {
									draft.splice(index, 1);
									console.log("Removed decoration from cache");
								} else {
									console.log("Decoration not found in cache");
								}
							} else {
								console.log("No draft found - query data not available");
							}
						}
					)
				);

				try {
					await queryFulfilled;
					console.log("Delete decoration query fulfilled successfully");
				} catch (error) {
					console.log(
						"Delete decoration query failed, reverting optimistic update:",
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
	useCreateDecorationMutation,
	useUpdateGiftMutation,
	useUpdateDecorationMutation,
	useEditGiftMutation,
	useEditDecorationMutation,
	useDeleteGiftMutation,
	useDeleteDecorationMutation,
	useGetGiftsQuery,
	useGetCardsQuery,
	useGetTasksQuery,
	useGetGuestListQuery,
	useGetDecorationsQuery,
} = api;
