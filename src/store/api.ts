import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createTracedBaseQuery, isRTKTracingEnabled } from "@/lib/traceRTK";

const baseQuery = fetchBaseQuery({
	baseUrl: "/api",
	credentials: "include",
});

const tracedBaseQuery = isRTKTracingEnabled()
	? createTracedBaseQuery(baseQuery)
	: baseQuery;

export const api = createApi({
	reducerPath: "api",
	baseQuery: tracedBaseQuery,
	tagTypes: [
		"Tasks",
		"Gifts",
		"Cards",
		"GuestList",
		"Decorations",
		"Events",
		"CandleLighting",
		"DateIdeas",
		"CostumeIdeas",
		"TrickOrTreatPrep",
		"MealPlanning",
		"PartyPlanning",
		"BabyShowerGames",
		"KwanzaaPrinciples",
		"Resolutions",
		"Reservations",
	],
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
		getHanukkahTasks: builder.query<
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
		getEvents: builder.query<any[], { holidayId: string; auth0User?: any }>({
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
				// Filter for events category
				const allTasks = response.data || [];
				return allTasks.filter((task: any) => task.category === "Events");
			},
			providesTags: (result, error, { holidayId }) => [
				{ type: "Events", id: holidayId },
			],
		}),
		getCandleLighting: builder.query<
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
				// Filter for candle lighting category
				const allTasks = response.data || [];
				return allTasks.filter(
					(task: any) => task.category === "Candle Lighting"
				);
			},
			providesTags: (result, error, { holidayId }) => [
				{ type: "CandleLighting", id: holidayId },
			],
		}),
		getDateIdeas: builder.query<any[], { holidayId: string; auth0User?: any }>({
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
				// Filter for date ideas category
				const allTasks = response.data || [];
				return allTasks.filter((task: any) => task.category === "Date Ideas");
			},
			providesTags: (result, error, { holidayId }) => [
				{ type: "DateIdeas", id: holidayId },
			],
		}),
		getResolutions: builder.query<
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
				// Filter for resolutions category
				const allTasks = response.data || [];
				return allTasks.filter((task: any) => task.category === "Resolutions");
			},
			providesTags: (result, error, { holidayId }) => [
				{ type: "Resolutions", id: holidayId },
			],
		}),
		getCostumeIdeas: builder.query<
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
				// Filter for costume ideas category
				const allTasks = response.data || [];
				return allTasks.filter(
					(task: any) => task.category === "Costume Ideas"
				);
			},
			providesTags: (result, error, { holidayId }) => [
				{ type: "CostumeIdeas", id: holidayId },
			],
		}),
		getTrickOrTreatPrep: builder.query<
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
				// Filter for trick or treat prep category
				const allTasks = response.data || [];
				return allTasks.filter(
					(task: any) => task.category === "Trick or Treat Prep"
				);
			},
			providesTags: (result, error, { holidayId }) => [
				{ type: "TrickOrTreatPrep", id: holidayId },
			],
		}),
		getMealPlanning: builder.query<
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
				// Filter for meal planning category
				const allTasks = response.data || [];
				return allTasks.filter(
					(task: any) => task.category === "Meal Planning"
				);
			},
			providesTags: (result, error, { holidayId }) => [
				{ type: "MealPlanning", id: holidayId },
			],
		}),
		getPartyPlanning: builder.query<
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
				// Filter for party planning category
				const allTasks = response.data || [];
				return allTasks.filter(
					(task: any) => task.category === "Party Planning"
				);
			},
			providesTags: (result, error, { holidayId }) => [
				{ type: "PartyPlanning", id: holidayId },
			],
		}),
		getBabyShowerGames: builder.query<
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
				// Filter for baby shower games category
				const allTasks = response.data || [];
				return allTasks.filter((task: any) => task.category === "Games");
			},
			providesTags: (result, error, { holidayId }) => [
				{ type: "BabyShowerGames", id: holidayId },
			],
		}),
		getKwanzaaPrinciples: builder.query<
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
				// Filter for daily principles category
				const allTasks = response.data || [];
				return allTasks.filter(
					(task: any) => task.category === "Daily Principles"
				);
			},
			providesTags: (result, error, { holidayId }) => [
				{ type: "KwanzaaPrinciples", id: holidayId },
			],
		}),
		getReservations: builder.query<
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
				// Filter for reservations category
				const allTasks = response.data || [];
				return allTasks.filter((task: any) => task.category === "Reservations");
			},
			providesTags: (result, error, { holidayId }) => [
				{ type: "Reservations", id: holidayId },
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
		createHanukkahTask: builder.mutation<
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
		// Generic card mutation that handles all operations
		cardOperation: builder.mutation<
			any,
			{ holidayId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, payload, auth0User }) => {
				// Handle different operations
				if (payload.action === "delete") {
					// Use DELETE method with query parameter
					return {
						url: `holidays/${holidayId}/cards?cardId=${payload.id}`,
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
					};
				} else if (payload.action) {
					// Use PUT for update operations
					return {
						url: `holidays/${holidayId}/cards`,
						method: "PUT",
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
					};
				} else {
					// Use POST for create operations
					return {
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
					};
				}
			},
			invalidatesTags: (result, error, { holidayId, payload }) => {
				// Don't invalidate cache for delete operations since we use optimistic updates
				if (payload.action === "delete") {
					return [];
				}
				return [{ type: "Cards", id: holidayId }];
			},
			// Use optimistic update for delete operations
			async onQueryStarted(
				{ holidayId, payload, auth0User },
				{ dispatch, queryFulfilled }
			) {
				if (payload.action === "delete") {
					console.log(
						"Delete card optimistic update - holidayId:",
						holidayId,
						"cardId:",
						payload.id
					);

					// Optimistically update the cache by removing the deleted card
					// Use the same parameters as the query to match the cache key exactly
					const patchResult = dispatch(
						api.util.updateQueryData(
							"getCards",
							{ holidayId, auth0User },
							(draft) => {
								console.log("UpdateQueryData callback - draft:", draft);
								if (draft) {
									const index = draft.findIndex(
										(card: any) => card.id === payload.id
									);
									console.log("Found card at index:", index);
									if (index !== -1) {
										draft.splice(index, 1);
										console.log("Removed card from cache");
									} else {
										console.log("Card not found in cache");
									}
								} else {
									console.log("No draft found - query data not available");
								}
							}
						)
					);

					try {
						await queryFulfilled;
						console.log("Delete card query fulfilled successfully");
					} catch (error) {
						console.log(
							"Delete card query failed, reverting optimistic update:",
							error
						);
						// If the delete fails, revert the optimistic update
						patchResult.undo();
					}
				}
			},
		}),
		updateCard: builder.mutation<
			any,
			{
				holidayId: string;
				cardId: string;
				isCompleted: boolean;
				auth0User?: any;
			}
		>({
			query: ({ holidayId, cardId, isCompleted, auth0User }) => ({
				url: `holidays/${holidayId}/cards`,
				method: "PUT",
				body: { cardId, isCompleted },
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
		editCard: builder.mutation<
			any,
			{ holidayId: string; cardId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, cardId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/cards`,
				method: "PATCH",
				body: { cardId, ...payload },
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
		deleteCard: builder.mutation<
			any,
			{ holidayId: string; cardId: string; auth0User?: any }
		>({
			query: ({ holidayId, cardId, auth0User }) => ({
				url: `holidays/${holidayId}/cards?cardId=${cardId}`,
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
				{ holidayId, cardId, auth0User },
				{ dispatch, queryFulfilled }
			) {
				console.log(
					"Delete card optimistic update - holidayId:",
					holidayId,
					"cardId:",
					cardId
				);

				// Optimistically update the cache by removing the deleted card
				const patchResult = dispatch(
					api.util.updateQueryData(
						"getCards",
						{ holidayId, auth0User },
						(draft) => {
							console.log("UpdateQueryData callback - draft:", draft);
							if (draft) {
								const index = draft.findIndex(
									(card: any) => card.id === cardId
								);
								console.log("Found card at index:", index);
								if (index !== -1) {
									draft.splice(index, 1);
									console.log("Removed card from cache");
								} else {
									console.log("Card not found in cache");
								}
							} else {
								console.log("No draft found - query data not available");
							}
						}
					)
				);

				try {
					await queryFulfilled;
					console.log("Delete card query fulfilled successfully");
				} catch (error) {
					console.log(
						"Delete card query failed, reverting optimistic update:",
						error
					);
					// If the delete fails, revert the optimistic update
					patchResult.undo();
				}
			},
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
		createEvent: builder.mutation<
			any,
			{ holidayId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/tasks`,
				method: "POST",
				body: { ...payload, category: "Events" },
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
				{ type: "Events", id: holidayId },
			],
		}),
		createCandleLighting: builder.mutation<
			any,
			{ holidayId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/tasks`,
				method: "POST",
				body: { ...payload, category: "Candle Lighting" },
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
				{ type: "CandleLighting", id: holidayId },
			],
		}),
		createDateIdeas: builder.mutation<
			any,
			{ holidayId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/tasks`,
				method: "POST",
				body: { ...payload, category: "Date Ideas" },
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
				{ type: "DateIdeas", id: holidayId },
			],
		}),
		createResolutions: builder.mutation<
			any,
			{ holidayId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/tasks`,
				method: "POST",
				body: { ...payload, category: "Resolutions" },
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
				{ type: "Resolutions", id: holidayId },
			],
		}),
		createReservations: builder.mutation<
			any,
			{ holidayId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/tasks`,
				method: "POST",
				body: { ...payload, category: "Reservations" },
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
				{ type: "Reservations", id: holidayId },
			],
		}),
		createCostumeIdeas: builder.mutation<
			any,
			{ holidayId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/tasks`,
				method: "POST",
				body: { ...payload, category: "Costume Ideas" },
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
				{ type: "CostumeIdeas", id: holidayId },
			],
		}),
		createTrickOrTreatPrep: builder.mutation<
			any,
			{ holidayId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/tasks`,
				method: "POST",
				body: { ...payload, category: "Trick or Treat Prep" },
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
				{ type: "TrickOrTreatPrep", id: holidayId },
			],
		}),
		createMealPlanning: builder.mutation<
			any,
			{ holidayId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/tasks`,
				method: "POST",
				body: { ...payload, category: "Meal Planning" },
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
				{ type: "MealPlanning", id: holidayId },
			],
		}),
		createPartyPlanning: builder.mutation<
			any,
			{ holidayId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/tasks`,
				method: "POST",
				body: { ...payload, category: "Party Planning" },
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
				{ type: "PartyPlanning", id: holidayId },
			],
		}),
		createBabyShowerGames: builder.mutation<
			any,
			{ holidayId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/tasks`,
				method: "POST",
				body: { ...payload, category: "Games" },
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
				{ type: "BabyShowerGames", id: holidayId },
			],
		}),
		createKwanzaaPrinciples: builder.mutation<
			any,
			{ holidayId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/tasks`,
				method: "POST",
				body: { ...payload, category: "Daily Principles" },
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
				{ type: "KwanzaaPrinciples", id: holidayId },
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
		updateEvent: builder.mutation<
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
				{ type: "Events", id: holidayId },
			],
		}),
		editEvent: builder.mutation<
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
				{ type: "Events", id: holidayId },
			],
		}),
		deleteEvent: builder.mutation<
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
					"Delete event optimistic update - holidayId:",
					holidayId,
					"taskId:",
					taskId
				);

				// Optimistically update the cache by removing the deleted event
				const patchResult = dispatch(
					api.util.updateQueryData(
						"getEvents",
						{ holidayId, auth0User },
						(draft) => {
							console.log("UpdateQueryData callback - draft:", draft);
							if (draft) {
								const index = draft.findIndex(
									(event: any) => event.id === taskId
								);
								console.log("Found event at index:", index);
								if (index !== -1) {
									draft.splice(index, 1);
									console.log("Removed event from cache");
								} else {
									console.log("Event not found in cache");
								}
							} else {
								console.log("No draft found - query data not available");
							}
						}
					)
				);

				try {
					await queryFulfilled;
					console.log("Delete event query fulfilled successfully");
				} catch (error) {
					console.log(
						"Delete event query failed, reverting optimistic update:",
						error
					);
					// If the delete fails, revert the optimistic update
					patchResult.undo();
				}
			},
		}),
		// Candle Lighting mutations
		updateCandleLighting: builder.mutation<
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
				{ type: "CandleLighting", id: holidayId },
			],
		}),
		editCandleLighting: builder.mutation<
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
				{ type: "CandleLighting", id: holidayId },
			],
		}),
		deleteCandleLighting: builder.mutation<
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
			async onQueryStarted(
				{ holidayId, taskId, auth0User },
				{ dispatch, queryFulfilled }
			) {
				const patchResult = dispatch(
					api.util.updateQueryData(
						"getCandleLighting",
						{ holidayId, auth0User },
						(draft) => {
							if (draft) {
								const index = draft.findIndex(
									(task: any) => task.id === taskId
								);
								if (index !== -1) {
									draft.splice(index, 1);
								}
							}
						}
					)
				);

				try {
					await queryFulfilled;
				} catch (error) {
					patchResult.undo();
				}
			},
		}),
		// Date Ideas mutations
		updateDateIdeas: builder.mutation<
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
				{ type: "DateIdeas", id: holidayId },
			],
		}),
		// Resolutions mutations
		updateResolutions: builder.mutation<
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
				{ type: "Resolutions", id: holidayId },
			],
		}),
		editDateIdeas: builder.mutation<
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
				{ type: "DateIdeas", id: holidayId },
			],
		}),
		editResolutions: builder.mutation<
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
				{ type: "Resolutions", id: holidayId },
			],
		}),
		deleteDateIdeas: builder.mutation<
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
			async onQueryStarted(
				{ holidayId, taskId, auth0User },
				{ dispatch, queryFulfilled }
			) {
				const patchResult = dispatch(
					api.util.updateQueryData(
						"getDateIdeas",
						{ holidayId, auth0User },
						(draft) => {
							if (draft) {
								const index = draft.findIndex(
									(task: any) => task.id === taskId
								);
								if (index !== -1) {
									draft.splice(index, 1);
								}
							}
						}
					)
				);

				try {
					await queryFulfilled;
				} catch (error) {
					patchResult.undo();
				}
			},
		}),
		deleteResolutions: builder.mutation<
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
			async onQueryStarted(
				{ holidayId, taskId, auth0User },
				{ dispatch, queryFulfilled }
			) {
				const patchResult = dispatch(
					api.util.updateQueryData(
						"getResolutions",
						{ holidayId, auth0User },
						(draft) => {
							if (draft) {
								const index = draft.findIndex(
									(task: any) => task.id === taskId
								);
								if (index !== -1) {
									draft.splice(index, 1);
								}
							}
						}
					)
				);

				try {
					await queryFulfilled;
				} catch (error) {
					patchResult.undo();
				}
			},
		}),
		// Reservations mutations
		updateReservations: builder.mutation<
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
				{ type: "Reservations", id: holidayId },
			],
		}),
		editReservations: builder.mutation<
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
				{ type: "Reservations", id: holidayId },
			],
		}),
		deleteReservations: builder.mutation<
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
			async onQueryStarted(
				{ holidayId, taskId, auth0User },
				{ dispatch, queryFulfilled }
			) {
				const patchResult = dispatch(
					api.util.updateQueryData(
						"getReservations",
						{ holidayId, auth0User },
						(draft) => {
							if (draft) {
								const index = draft.findIndex(
									(task: any) => task.id === taskId
								);
								if (index !== -1) {
									draft.splice(index, 1);
								}
							}
						}
					)
				);

				try {
					await queryFulfilled;
				} catch (error) {
					patchResult.undo();
				}
			},
		}),
		// Costume Ideas mutations
		updateCostumeIdeas: builder.mutation<
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
				{ type: "CostumeIdeas", id: holidayId },
			],
		}),
		editCostumeIdeas: builder.mutation<
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
				{ type: "CostumeIdeas", id: holidayId },
			],
		}),
		deleteCostumeIdeas: builder.mutation<
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
			async onQueryStarted(
				{ holidayId, taskId, auth0User },
				{ dispatch, queryFulfilled }
			) {
				const patchResult = dispatch(
					api.util.updateQueryData(
						"getCostumeIdeas",
						{ holidayId, auth0User },
						(draft) => {
							if (draft) {
								const index = draft.findIndex(
									(task: any) => task.id === taskId
								);
								if (index !== -1) {
									draft.splice(index, 1);
								}
							}
						}
					)
				);

				try {
					await queryFulfilled;
				} catch (error) {
					patchResult.undo();
				}
			},
		}),
		// Trick or Treat Prep mutations
		updateTrickOrTreatPrep: builder.mutation<
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
				{ type: "TrickOrTreatPrep", id: holidayId },
			],
		}),
		editTrickOrTreatPrep: builder.mutation<
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
				{ type: "TrickOrTreatPrep", id: holidayId },
			],
		}),
		deleteTrickOrTreatPrep: builder.mutation<
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
			async onQueryStarted(
				{ holidayId, taskId, auth0User },
				{ dispatch, queryFulfilled }
			) {
				const patchResult = dispatch(
					api.util.updateQueryData(
						"getTrickOrTreatPrep",
						{ holidayId, auth0User },
						(draft) => {
							if (draft) {
								const index = draft.findIndex(
									(task: any) => task.id === taskId
								);
								if (index !== -1) {
									draft.splice(index, 1);
								}
							}
						}
					)
				);

				try {
					await queryFulfilled;
				} catch (error) {
					patchResult.undo();
				}
			},
		}),
		// Meal Planning mutations
		updateMealPlanning: builder.mutation<
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
				{ type: "MealPlanning", id: holidayId },
			],
		}),
		editMealPlanning: builder.mutation<
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
				{ type: "MealPlanning", id: holidayId },
			],
		}),
		deleteMealPlanning: builder.mutation<
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
			async onQueryStarted(
				{ holidayId, taskId, auth0User },
				{ dispatch, queryFulfilled }
			) {
				const patchResult = dispatch(
					api.util.updateQueryData(
						"getMealPlanning",
						{ holidayId, auth0User },
						(draft) => {
							if (draft) {
								const index = draft.findIndex(
									(task: any) => task.id === taskId
								);
								if (index !== -1) {
									draft.splice(index, 1);
								}
							}
						}
					)
				);

				try {
					await queryFulfilled;
				} catch (error) {
					patchResult.undo();
				}
			},
		}),
		// Party Planning mutations
		updatePartyPlanning: builder.mutation<
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
				{ type: "PartyPlanning", id: holidayId },
			],
		}),
		updateBabyShowerGames: builder.mutation<
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
				{ type: "BabyShowerGames", id: holidayId },
			],
		}),
		editPartyPlanning: builder.mutation<
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
				{ type: "PartyPlanning", id: holidayId },
			],
		}),
		editBabyShowerGames: builder.mutation<
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
				{ type: "BabyShowerGames", id: holidayId },
			],
		}),
		deletePartyPlanning: builder.mutation<
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
			async onQueryStarted(
				{ holidayId, taskId, auth0User },
				{ dispatch, queryFulfilled }
			) {
				const patchResult = dispatch(
					api.util.updateQueryData(
						"getPartyPlanning",
						{ holidayId, auth0User },
						(draft) => {
							if (draft) {
								const index = draft.findIndex(
									(task: any) => task.id === taskId
								);
								if (index !== -1) {
									draft.splice(index, 1);
								}
							}
						}
					)
				);

				try {
					await queryFulfilled;
				} catch (error) {
					patchResult.undo();
				}
			},
		}),
		deleteBabyShowerGames: builder.mutation<
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
			async onQueryStarted(
				{ holidayId, taskId, auth0User },
				{ dispatch, queryFulfilled }
			) {
				const patchResult = dispatch(
					api.util.updateQueryData(
						"getBabyShowerGames",
						{ holidayId, auth0User },
						(draft) => {
							if (draft) {
								const index = draft.findIndex(
									(task: any) => task.id === taskId
								);
								if (index !== -1) {
									draft.splice(index, 1);
								}
							}
						}
					)
				);

				try {
					await queryFulfilled;
				} catch (error) {
					patchResult.undo();
				}
			},
		}),
		// Kwanzaa Principles mutations
		updateKwanzaaPrinciples: builder.mutation<
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
				{ type: "KwanzaaPrinciples", id: holidayId },
			],
		}),
		editKwanzaaPrinciples: builder.mutation<
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
				{ type: "KwanzaaPrinciples", id: holidayId },
			],
		}),
		deleteKwanzaaPrinciples: builder.mutation<
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
			async onQueryStarted(
				{ holidayId, taskId, auth0User },
				{ dispatch, queryFulfilled }
			) {
				const patchResult = dispatch(
					api.util.updateQueryData(
						"getKwanzaaPrinciples",
						{ holidayId, auth0User },
						(draft) => {
							if (draft) {
								const index = draft.findIndex(
									(task: any) => task.id === taskId
								);
								if (index !== -1) {
									draft.splice(index, 1);
								}
							}
						}
					)
				);

				try {
					await queryFulfilled;
				} catch (error) {
					patchResult.undo();
				}
			},
		}),
		// Guest List mutations
		updateGuest: builder.mutation<
			any,
			{
				holidayId: string;
				guestId: string;
				isCompleted: boolean;
				auth0User?: any;
			}
		>({
			query: ({ holidayId, guestId, isCompleted, auth0User }) => ({
				url: `holidays/${holidayId}/guest-lists`,
				method: "PUT",
				body: { guestId, isCompleted },
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
		editGuest: builder.mutation<
			any,
			{ holidayId: string; guestId: string; payload: any; auth0User?: any }
		>({
			query: ({ holidayId, guestId, payload, auth0User }) => ({
				url: `holidays/${holidayId}/guest-lists`,
				method: "PATCH",
				body: { guestId, ...payload },
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
		deleteGuest: builder.mutation<
			any,
			{ holidayId: string; guestId: string; auth0User?: any }
		>({
			query: ({ holidayId, guestId, auth0User }) => ({
				url: `holidays/${holidayId}/guest-lists?guestId=${guestId}`,
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
				{ holidayId, guestId, auth0User },
				{ dispatch, queryFulfilled }
			) {
				console.log(
					"Delete guest optimistic update - holidayId:",
					holidayId,
					"guestId:",
					guestId
				);

				// Optimistically update the cache by removing the deleted guest
				const patchResult = dispatch(
					api.util.updateQueryData(
						"getGuestList",
						{ holidayId, auth0User },
						(draft) => {
							console.log("UpdateQueryData callback - draft:", draft);
							if (draft) {
								const index = draft.findIndex(
									(guest: any) => guest.id === guestId
								);
								console.log("Found guest at index:", index);
								if (index !== -1) {
									draft.splice(index, 1);
									console.log("Removed guest from cache");
								} else {
									console.log("Guest not found in cache");
								}
							} else {
								console.log("No draft found - query data not available");
							}
						}
					)
				);

				try {
					await queryFulfilled;
					console.log("Delete guest query fulfilled successfully");
				} catch (error) {
					console.log(
						"Delete guest query failed, reverting optimistic update:",
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
	useCreateEventMutation,
	useCreateCandleLightingMutation,
	useCreateDateIdeasMutation,
	useCreateResolutionsMutation,
	useCreateReservationsMutation,
	useCreateCostumeIdeasMutation,
	useCreateTrickOrTreatPrepMutation,
	useCreateMealPlanningMutation,
	useCreatePartyPlanningMutation,
	useCreateBabyShowerGamesMutation,
	useCreateKwanzaaPrinciplesMutation,
	useUpdateGiftMutation,
	useUpdateCardMutation,
	useUpdateDecorationMutation,
	useUpdateEventMutation,
	useUpdateCandleLightingMutation,
	useUpdateDateIdeasMutation,
	useUpdateResolutionsMutation,
	useUpdateReservationsMutation,
	useUpdateCostumeIdeasMutation,
	useUpdateTrickOrTreatPrepMutation,
	useUpdateMealPlanningMutation,
	useUpdatePartyPlanningMutation,
	useUpdateBabyShowerGamesMutation,
	useUpdateKwanzaaPrinciplesMutation,
	useEditGiftMutation,
	useEditCardMutation,
	useEditDecorationMutation,
	useEditEventMutation,
	useEditCandleLightingMutation,
	useEditDateIdeasMutation,
	useEditResolutionsMutation,
	useEditReservationsMutation,
	useEditCostumeIdeasMutation,
	useEditTrickOrTreatPrepMutation,
	useEditMealPlanningMutation,
	useEditPartyPlanningMutation,
	useEditBabyShowerGamesMutation,
	useEditKwanzaaPrinciplesMutation,
	useDeleteGiftMutation,
	useDeleteCardMutation,
	useDeleteDecorationMutation,
	useDeleteEventMutation,
	useDeleteCandleLightingMutation,
	useDeleteDateIdeasMutation,
	useDeleteResolutionsMutation,
	useDeleteReservationsMutation,
	useDeleteCostumeIdeasMutation,
	useDeleteTrickOrTreatPrepMutation,
	useDeleteMealPlanningMutation,
	useDeletePartyPlanningMutation,
	useDeleteBabyShowerGamesMutation,
	useDeleteKwanzaaPrinciplesMutation,
	useUpdateGuestMutation,
	useEditGuestMutation,
	useDeleteGuestMutation,
	useCardOperationMutation,
	useGetGiftsQuery,
	useGetCardsQuery,
	useGetTasksQuery,
	useGetGuestListQuery,
	useGetDecorationsQuery,
	useGetEventsQuery,
	useGetCandleLightingQuery,
	useGetDateIdeasQuery,
	useGetResolutionsQuery,
	useGetReservationsQuery,
	useGetCostumeIdeasQuery,
	useGetTrickOrTreatPrepQuery,
	useGetMealPlanningQuery,
	useGetPartyPlanningQuery,
	useGetBabyShowerGamesQuery,
	useGetKwanzaaPrinciplesQuery,
} = api;
