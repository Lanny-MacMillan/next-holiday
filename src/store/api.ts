import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createTracedBaseQuery, isRTKTracingEnabled } from '@/lib/traceRTK';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
});

const tracedBaseQuery = isRTKTracingEnabled()
  ? createTracedBaseQuery(baseQuery)
  : baseQuery;

export const api = createApi({
  reducerPath: 'api',
  baseQuery: tracedBaseQuery,
  tagTypes: [
    'Tasks',
    'Gifts',
    'Cards',
    'GuestList',
    'Decorations',
    'Events',
    'CandleLighting',
    'DateIdeas',
    'CostumeIdeas',
    'TrickOrTreatPrep',
    'MealPlanning',
    'PartyPlanning',
    'BabyShowerGames',
    'KwanzaaPrinciples',
    'Resolutions',
    'Reservations',
  ],

  // Performance optimizations
  keepUnusedDataFor: 60, // Keep cache for 60 seconds
  refetchOnMountOrArgChange: 30, // Refetch if data is older than 30 seconds
  refetchOnFocus: true, // Refetch when window regains focus
  refetchOnReconnect: true, // Refetch when network reconnects

  endpoints: builder => ({
    // Query endpoints
    getGifts: builder.query<any[], { holidayId: string; auth0User?: any }>({
      query: ({ holidayId, auth0User }) => ({
        url: `holidays/${holidayId}/gifts`,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        { type: 'Gifts', id: holidayId },
      ],
    }),

    // Query to get all gifts for a user across all holidays
    getAllGifts: builder.query<any[], { auth0User?: any }>({
      query: ({ auth0User }) => ({
        url: `gifts`,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
      providesTags: result => [{ type: 'Gifts', id: 'LIST' }],
    }),

    getCards: builder.query<any[], { holidayId: string; auth0User?: any }>({
      query: ({ holidayId, auth0User }) => ({
        url: `holidays/${holidayId}/cards`,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        { type: 'Cards', id: holidayId },
      ],
    }),
    // Query to get all cards for a user across all holidays
    getAllCards: builder.query<any[], { auth0User?: any }>({
      query: ({ auth0User }) => ({
        url: `cards`,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
      providesTags: result => [{ type: 'Cards', id: 'LIST' }],
    }),
    getTasks: builder.query<any[], { holidayId: string; auth0User?: any }>({
      query: ({ holidayId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        { type: 'Tasks', id: holidayId },
      ],
    }),
    // Query to get all tasks for a user across all holidays
    getAllTasks: builder.query<any[], { auth0User?: any }>({
      query: ({ auth0User }) => ({
        url: `tasks`,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
      providesTags: result => [{ type: 'Tasks', id: 'LIST' }],
    }),
    getHanukkahTasks: builder.query<any[], { holidayId: string; auth0User?: any }>({
      query: ({ holidayId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        { type: 'Tasks', id: holidayId },
      ],
    }),
    getGuestList: builder.query<any[], { holidayId: string; auth0User?: any }>({
      query: ({ holidayId, auth0User }) => ({
        url: `holidays/${holidayId}/guest-lists`,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        { type: 'GuestList', id: holidayId },
      ],
    }),
    getDecorations: builder.query<any[], { holidayId: string; auth0User?: any }>({
      query: ({ holidayId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        return allTasks.filter((task: any) => task.category === 'Decorations');
      },
      providesTags: (result, error, { holidayId }) => [
        { type: 'Decorations', id: holidayId },
      ],
    }),
    getEvents: builder.query<any[], { holidayId: string; auth0User?: any }>({
      query: ({ holidayId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        return allTasks.filter((task: any) => task.category === 'Events');
      },
      providesTags: (result, error, { holidayId }) => [
        { type: 'Events', id: holidayId },
      ],
    }),
    getCandleLighting: builder.query<any[], { holidayId: string; auth0User?: any }>({
      query: ({ holidayId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        return allTasks.filter((task: any) => task.category === 'Candle Lighting');
      },
      providesTags: (result, error, { holidayId }) => [
        { type: 'CandleLighting', id: holidayId },
      ],
    }),
    getDateIdeas: builder.query<any[], { holidayId: string; auth0User?: any }>({
      query: ({ holidayId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        return allTasks.filter((task: any) => task.category === 'Date Ideas');
      },
      providesTags: (result, error, { holidayId }) => [
        { type: 'DateIdeas', id: holidayId },
      ],
    }),
    getResolutions: builder.query<any[], { holidayId: string; auth0User?: any }>({
      query: ({ holidayId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        return allTasks.filter((task: any) => task.category === 'Resolutions');
      },
      providesTags: (result, error, { holidayId }) => [
        { type: 'Resolutions', id: holidayId },
      ],
    }),
    getCostumeIdeas: builder.query<any[], { holidayId: string; auth0User?: any }>({
      query: ({ holidayId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        return allTasks.filter((task: any) => task.category === 'Costume Ideas');
      },
      providesTags: (result, error, { holidayId }) => [
        { type: 'CostumeIdeas', id: holidayId },
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
              'x-test-user': JSON.stringify({
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
          (task: any) => task.category === 'Trick or Treat Prep',
        );
      },
      providesTags: (result, error, { holidayId }) => [
        { type: 'TrickOrTreatPrep', id: holidayId },
      ],
    }),
    getMealPlanning: builder.query<any[], { holidayId: string; auth0User?: any }>({
      query: ({ holidayId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        return allTasks.filter((task: any) => task.category === 'Meal Planning');
      },
      providesTags: (result, error, { holidayId }) => [
        { type: 'MealPlanning', id: holidayId },
      ],
    }),
    getPartyPlanning: builder.query<any[], { holidayId: string; auth0User?: any }>({
      query: ({ holidayId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        return allTasks.filter((task: any) => task.category === 'Party Planning');
      },
      providesTags: (result, error, { holidayId }) => [
        { type: 'PartyPlanning', id: holidayId },
      ],
    }),
    getBabyShowerGames: builder.query<any[], { holidayId: string; auth0User?: any }>(
      {
        query: ({ holidayId, auth0User }) => ({
          url: `holidays/${holidayId}/tasks`,
          headers: auth0User
            ? {
                'x-test-user': JSON.stringify({
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
          return allTasks.filter((task: any) => task.category === 'Games');
        },
        providesTags: (result, error, { holidayId }) => [
          { type: 'BabyShowerGames', id: holidayId },
        ],
      },
    ),
    getKwanzaaPrinciples: builder.query<
      any[],
      { holidayId: string; auth0User?: any }
    >({
      query: ({ holidayId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        return allTasks.filter((task: any) => task.category === 'Daily Principles');
      },
      providesTags: (result, error, { holidayId }) => [
        { type: 'KwanzaaPrinciples', id: holidayId },
      ],
    }),
    getReservations: builder.query<any[], { holidayId: string; auth0User?: any }>({
      query: ({ holidayId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        return allTasks.filter((task: any) => task.category === 'Reservations');
      },
      providesTags: (result, error, { holidayId }) => [
        { type: 'Reservations', id: holidayId },
      ],
    }),
    createTask: builder.mutation<
      any,
      { holidayId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'POST',
        body: payload,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Tasks', id: holidayId },
      ],
      //   SAME PATTERN AS createGift: Traditional Redux pattern - wait for success, then update Home Slice
      async onQueryStarted(
        { holidayId, payload, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🚀 Creating task...', { holidayId, payload });

          //   Wait for successful API response (no optimistic updates)
          const { data: response } = await queryFulfilled;

          // Extract actual task data from response (API returns { data: task })
          const newTaskFromApi = response.data.data;

          console.log('📦 Task response received:', response);
          console.log('🎁 Task data from API:', newTaskFromApi);

          //   Import Home Slice to avoid circular dependencies
          const { addTaskToHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with API data
          dispatch(
            addTaskToHomeData({
              holidayId,
              task: newTaskFromApi,
            }),
          );

          console.log('  Task created and Home Slice updated:', newTaskFromApi);
        } catch (error) {
          // ❌ API failed - no state update needed, just log
          console.error('❌ Task creation failed:', error);
        }
      },
    }),
    updateTask: builder.mutation<
      any,
      { holidayId: string; taskId: string; updates: any; auth0User?: any }
    >({
      query: ({ holidayId, taskId, updates, auth0User }) => ({
        url: `holidays/${holidayId}/tasks/${taskId}`,
        method: 'PATCH',
        body: updates,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Tasks', id: holidayId },
      ],
      //   Traditional Redux pattern: wait for API success then update Home Slice
      async onQueryStarted(
        { holidayId, taskId, updates, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🔄 Updating task...', { holidayId, taskId, updates });

          //   Wait for successful API response
          const { data: response } = await queryFulfilled;

          //   Extract actual task data from response (API returns { success: true, data: { data: task } })
          const updatedTaskFromApi = response.data.data;

          console.log('📦 Task update response received:', response);
          console.log('🎁 Updated task data from API:', updatedTaskFromApi);

          //   Import Home Slice actions to avoid circular dependencies
          const { updateTaskInHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with server response
          dispatch(
            updateTaskInHomeData({
              holidayId,
              taskId,
              updates: updatedTaskFromApi,
            }),
          );

          console.log('✅ Task updated and Home Slice updated:', updatedTaskFromApi);
        } catch (error) {
          // ❌ API failed - let RTK Query handle the error state
          console.error('❌ Failed to update task:', error);
        }
      },
    }),
    deleteTask: builder.mutation<
      any,
      { holidayId: string; taskId: string; auth0User?: any }
    >({
      query: ({ holidayId, taskId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks?taskId=${taskId}`,
        method: 'DELETE',
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Tasks', id: holidayId },
      ],
      // Traditional Redux pattern: wait for API success then update state
      async onQueryStarted(
        { holidayId, taskId, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          // Wait for API to succeed
          await queryFulfilled;

          // Import Home Slice actions to avoid circular dependencies
          const { removeTaskFromHomeData } = await import('./slices/homeSlice');

          // Remove from Home Slice after successful deletion
          dispatch(
            removeTaskFromHomeData({
              holidayId,
              taskId,
            }),
          );
        } catch (error) {
          // Let RTK Query handle the error state
          console.error('Failed to delete task:', error);
        }
      },
    }),
    toggleTaskCompletion: builder.mutation<
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
        method: 'PUT',
        body: { taskId, isCompleted },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Tasks', id: holidayId },
      ],
      //   Traditional Redux pattern: wait for API success then update Home Slice
      async onQueryStarted(
        { holidayId, taskId, isCompleted, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🔄 Toggling task completion...', {
            holidayId,
            taskId,
            isCompleted,
          });

          //   Wait for successful API response
          const { data: response } = await queryFulfilled;

          //   Extract actual task data from response (API returns { data: task })
          const updatedTaskFromApi = response.data.data;

          console.log('📦 Toggle task response received:', response);
          console.log('🎁 Updated task data from API:', updatedTaskFromApi);

          //   Import Home Slice actions to avoid circular dependencies
          const { updateTaskInHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with server response
          dispatch(
            updateTaskInHomeData({
              holidayId,
              taskId,
              updates: updatedTaskFromApi,
            }),
          );

          console.log(
            '  Task completion toggled and Home Slice updated:',
            updatedTaskFromApi,
          );
        } catch (error) {
          // ❌ API failed - let RTK Query handle the error state
          console.error('❌ Failed to toggle task completion:', error);
        }
      },
    }),
    createHanukkahTask: builder.mutation<
      any,
      { holidayId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'POST',
        body: payload,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Tasks', id: holidayId },
      ],
    }),
    createGift: builder.mutation<
      any,
      { holidayId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/gifts`,
        method: 'POST',
        body: payload,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Gifts', id: holidayId },
      ],
      //   SIMPLIFIED: Traditional Redux pattern - wait for success, then update Home Slice
      async onQueryStarted(
        { holidayId, payload, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🚀 Creating gift...', { holidayId, payload });

          //   Wait for successful API response (no optimistic updates)
          const { data: response } = await queryFulfilled;

          //   ✅ CRITICAL: Extract gift from { data: gift } format
          const newGiftFromApi = response.data.data;

          console.log('📦 Gift response received:', response);
          console.log('✅ Gift data from API:', newGiftFromApi);

          //   Import Home Slice to avoid circular dependencies
          const { addGiftToHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with API data (recipient field already correct)
          dispatch(
            addGiftToHomeData({
              holidayId,
              gift: newGiftFromApi,
            }),
          );

          console.log('  Gift created and Home Slice updated:', newGiftFromApi);
        } catch (error) {
          // ❌ API failed - no state update needed, just log
          console.error('❌ Gift creation failed:', error);
        }
      },
    }),
    createCard: builder.mutation<
      any,
      { holidayId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/cards`,
        method: 'POST',
        body: payload,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Cards', id: holidayId },
      ],
      //   SAME PATTERN AS createGift: Traditional Redux pattern - wait for success, then update Home Slice
      async onQueryStarted(
        { holidayId, payload, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🚀 Creating card...', { holidayId, payload });

          //   Wait for successful API response (no optimistic updates)
          const { data: response } = await queryFulfilled;

          //   Extract actual card data from response (API returns { data: card })
          const newCardFromApi = response.data.data;

          console.log('📦 Card response received:', response);
          console.log('🎁 Card data from API:', newCardFromApi);
          console.log('  Card recipient from API:', newCardFromApi.recipient);

          //   Import Home Slice to avoid circular dependencies
          const { addCardToHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with API data
          dispatch(
            addCardToHomeData({
              holidayId,
              card: newCardFromApi,
            }),
          );

          console.log('  Card created and Home Slice updated:', newCardFromApi);
        } catch (error) {
          // ❌ API failed - no state update needed, just log
          console.error('❌ Card creation failed:', error);
        }
      },
    }),
    // Generic card mutation that handles all operations
    cardOperation: builder.mutation<
      any,
      { holidayId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, payload, auth0User }) => {
        // Handle different operations
        if (payload.action === 'delete') {
          // Use DELETE method with query parameter
          return {
            url: `holidays/${holidayId}/cards?cardId=${payload.id}`,
            method: 'DELETE',
            headers: auth0User
              ? {
                  'x-test-user': JSON.stringify({
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
            method: 'PUT',
            body: payload,
            headers: auth0User
              ? {
                  'x-test-user': JSON.stringify({
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
            method: 'POST',
            body: payload,
            headers: auth0User
              ? {
                  'x-test-user': JSON.stringify({
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
        if (payload.action === 'delete') {
          return [];
        }
        return [{ type: 'Cards', id: holidayId }];
      },
      // Use optimistic update for delete operations
      async onQueryStarted(
        { holidayId, payload, auth0User },
        { dispatch, queryFulfilled },
      ) {
        if (payload.action === 'delete') {
          console.log(
            'Delete card optimistic update - holidayId:',
            holidayId,
            'cardId:',
            payload.id,
          );

          // Optimistically update the cache by removing the deleted card
          // Use the same parameters as the query to match the cache key exactly
          const patchResult = dispatch(
            api.util.updateQueryData('getCards', { holidayId, auth0User }, draft => {
              console.log('UpdateQueryData callback - draft:', draft);
              if (draft) {
                const index = draft.findIndex((card: any) => card.id === payload.id);
                console.log('Found card at index:', index);
                if (index !== -1) {
                  draft.splice(index, 1);
                  console.log('Removed card from cache');
                } else {
                  console.log('Card not found in cache');
                }
              } else {
                console.log('No draft found - query data not available');
              }
            }),
          );

          try {
            await queryFulfilled;
            console.log('Delete card query fulfilled successfully');
          } catch (error) {
            console.log(
              'Delete card query failed, reverting optimistic update:',
              error,
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
        method: 'PUT',
        body: { cardId, isCompleted },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Cards', id: holidayId },
      ],
      //   SAME PATTERN AS updateGift: Traditional Redux pattern - wait for success, then update Home Slice
      async onQueryStarted(
        { holidayId, cardId, isCompleted, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🔄 Toggling card completion...', {
            holidayId,
            cardId,
            isCompleted,
          });

          //   Wait for successful API response
          const { data: response } = await queryFulfilled;

          //   Extract actual card data from response (API returns { data: card })
          const updatedCardFromApi = response.data.data;

          console.log('📦 Toggle card response received:', response);
          console.log('🎁 Updated card data from API:', updatedCardFromApi);
          console.log(
            '  Updated card recipient from API:',
            updatedCardFromApi.recipient,
          );

          //   Import Home Slice to avoid circular dependencies
          const { updateCardInHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with API data
          dispatch(
            updateCardInHomeData({
              holidayId,
              cardId,
              updates: updatedCardFromApi,
            }),
          );

          console.log(
            '  Card completion toggled and Home Slice updated:',
            updatedCardFromApi,
          );
        } catch (error) {
          // ❌ API failed - no state update needed, just log
          console.error('❌ Card completion toggle failed:', error);
        }
      },
    }),
    editCard: builder.mutation<
      any,
      { holidayId: string; cardId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, cardId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/cards`,
        method: 'PATCH',
        body: { cardId, ...payload },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Cards', id: holidayId },
      ],
      //   SAME PATTERN AS editGift: Traditional Redux pattern - wait for success, then update Home Slice
      async onQueryStarted(
        { holidayId, cardId, payload, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🔄 Editing card...', { holidayId, cardId, payload });

          //   Wait for successful API response
          const { data: response } = await queryFulfilled;

          //   Extract actual card data from response (API returns { data: card })
          const updatedCardFromApi = response.data.data;

          console.log('📦 Edit card response received:', response);
          console.log('🎁 Updated card data from API:', updatedCardFromApi);
          console.log(
            '  Updated card recipient from API:',
            updatedCardFromApi.recipient,
          );

          //   Import Home Slice to avoid circular dependencies
          const { updateCardInHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with API data
          dispatch(
            updateCardInHomeData({
              holidayId,
              cardId,
              updates: updatedCardFromApi,
            }),
          );

          console.log('  Card edited and Home Slice updated:', updatedCardFromApi);
        } catch (error) {
          // ❌ API failed - no state update needed, just log
          console.error('❌ Card edit failed:', error);
        }
      },
    }),
    deleteCard: builder.mutation<
      any,
      { holidayId: string; cardId: string; auth0User?: any }
    >({
      query: ({ holidayId, cardId, auth0User }) => ({
        url: `holidays/${holidayId}/cards?cardId=${cardId}`,
        method: 'DELETE',
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        { dispatch, queryFulfilled },
      ) {
        // Import sync utilities to avoid circular dependencies
        const { syncRemoveFromHomeSlice, syncAddToHomeSlice } =
          await import('./syncUtils');

        console.log(
          'Delete card optimistic update - holidayId:',
          holidayId,
          'cardId:',
          cardId,
        );

        // Store the deleted card data for rollback
        let deletedCard: any = null;

        // 1.   Optimistic RTK Query cache update
        const patchResult = dispatch(
          api.util.updateQueryData('getCards', { holidayId, auth0User }, draft => {
            console.log('UpdateQueryData callback - draft:', draft);
            if (draft) {
              const index = draft.findIndex((card: any) => card.id === cardId);
              console.log('Found card at index:', index);
              if (index !== -1) {
                // Store the card data before removal
                deletedCard = { ...draft[index] };
                draft.splice(index, 1);
                console.log('Removed card from cache');
              } else {
                console.log('Card not found in cache');
              }
            } else {
              console.log('No draft found - query data not available');
            }
          }),
        );

        // 2.   NEW: Optimistic Home Slice sync
        syncRemoveFromHomeSlice({
          entityType: 'card',
          holidayId,
          entityId: cardId,
          dispatch,
        });

        try {
          await queryFulfilled;
          console.log('Delete card query fulfilled successfully');

          // 3.   Delete confirmed by server - no additional sync needed
        } catch (error) {
          console.log(
            'Delete card query failed, reverting optimistic update:',
            error,
          );

          // 4.   Revert both RTK Query cache and Home Slice on error
          patchResult.undo();
          if (deletedCard) {
            syncAddToHomeSlice({
              entityType: 'card',
              holidayId,
              optimisticData: deletedCard,
              dispatch,
            });
          }
        }
      },
    }),
    createGuest: builder.mutation<
      any,
      { holidayId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/guest-lists`,
        method: 'POST',
        body: payload,
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      // NOTE: No invalidatesTags since we manually update Home Slice in onQueryStarted
      // Traditional Redux pattern - wait for success, then update Home Slice
      async onQueryStarted(
        { holidayId, payload, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🚀 Creating guest...', { holidayId, payload });

          // Wait for successful API response (no optimistic updates)
          const { data: response } = await queryFulfilled;

          // ✅ CRITICAL: Extract guest from response.data (not response.data.data for guests)
          const newGuestFromApi = response.data;

          console.log('📦 Guest response received:', response);
          console.log('✅ Guest data from API:', newGuestFromApi);

          // Import Home Slice to avoid circular dependencies
          const { addGuestToHomeData } = await import('./slices/homeSlice');

          // Update Home Slice with API data
          dispatch(
            addGuestToHomeData({
              holidayId,
              guest: newGuestFromApi,
            }),
          );

          console.log('✅ Guest created and Home Slice updated:', newGuestFromApi);
        } catch (error) {
          // ❌ API failed - no state update needed, just log
          console.error('❌ Guest creation failed:', error);
        }
      },
    }),
    createDecoration: builder.mutation<
      any,
      { holidayId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'POST',
        body: { ...payload, category: 'Decorations' },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Decorations', id: holidayId },
      ],
      //   Traditional Redux pattern - wait for success, then update Home Slice
      async onQueryStarted(
        { holidayId, payload, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🚀 Creating decoration...', { holidayId, payload });

          //   Wait for successful API response (no optimistic updates)
          const { data: response } = await queryFulfilled;

          // 🚨 CRITICAL: Extract entity from { data: entity } format
          const newDecorationFromApi = response.data.data;

          console.log('📦 Decoration response received:', response);
          console.log('✅ Decoration data from API:', newDecorationFromApi);

          //   Import Home Slice to avoid circular dependencies
          const { addDecorationToHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with API data
          dispatch(
            addDecorationToHomeData({
              holidayId,
              decoration: newDecorationFromApi,
            }),
          );

          console.log(
            '✅ Decoration created and Home Slice updated:',
            newDecorationFromApi,
          );
        } catch (error) {
          // ❌ API failed - no state update needed, just log
          console.error('❌ Decoration creation failed:', error);
        }
      },
    }),
    createEvent: builder.mutation<
      any,
      { holidayId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'POST',
        body: { ...payload, category: 'Events' },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Events', id: holidayId },
      ],
      //   Traditional Redux pattern - wait for success, then update Home Slice
      async onQueryStarted(
        { holidayId, payload, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🚀 Creating event...', { holidayId, payload });

          //   Wait for successful API response (no optimistic updates)
          const { data: response } = await queryFulfilled;

          // 🚨 CRITICAL: Extract entity from { data: entity } format
          const newEventFromApi = response.data.data;

          console.log('📦 Event response received:', response);
          console.log('✅ Event data from API:', newEventFromApi);

          //   Import Home Slice to avoid circular dependencies
          const { addTaskToHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with API data (events stored as tasks with category "Events")
          dispatch(
            addTaskToHomeData({
              holidayId,
              task: newEventFromApi,
            }),
          );

          console.log('✅ Event created and Home Slice updated:', newEventFromApi);
        } catch (error) {
          // ❌ API failed - no state update needed, just log
          console.error('❌ Event creation failed:', error);
        }
      },
    }),
    createCandleLighting: builder.mutation<
      any,
      { holidayId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'POST',
        body: { ...payload, category: 'Candle Lighting' },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'CandleLighting', id: holidayId },
      ],
      //   Traditional Redux pattern - wait for success, then update Home Slice
      async onQueryStarted(
        { holidayId, payload, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🚀 Creating candle lighting task...', { holidayId, payload });

          //   Wait for successful API response (no optimistic updates)
          const { data: response } = await queryFulfilled;

          // 🚨 CRITICAL: Extract entity from { data: entity } format
          const newTaskFromApi = response.data.data;

          console.log('📦 Candle lighting task response received:', response);
          console.log('✅ Candle lighting task data from API:', newTaskFromApi);

          //   Import Home Slice to avoid circular dependencies
          const { addTaskToHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with API data (candle lighting is a task category)
          dispatch(
            addTaskToHomeData({
              holidayId,
              task: newTaskFromApi,
            }),
          );

          console.log(
            '✅ Candle lighting task created and Home Slice updated:',
            newTaskFromApi,
          );
        } catch (error) {
          // ❌ API failed - no state update needed, just log
          console.error('❌ Candle lighting task creation failed:', error);
        }
      },
    }),
    createDateIdeas: builder.mutation<
      any,
      { holidayId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'POST',
        body: { ...payload, category: 'Date Ideas' },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'DateIdeas', id: holidayId },
      ],
    }),
    createResolutions: builder.mutation<
      any,
      { holidayId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'POST',
        body: { ...payload, category: 'Resolutions' },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Resolutions', id: holidayId },
      ],
      //   Traditional Redux pattern - wait for success, then update Home Slice
      async onQueryStarted(
        { holidayId, payload, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🚀 Creating resolution...', { holidayId, payload });

          //   Wait for successful API response (no optimistic updates)
          const { data: response } = await queryFulfilled;

          // 🚨 CRITICAL: Extract entity from { data: entity } format
          const newResolutionFromApi = response.data.data;

          console.log('📦 Resolution response received:', response);
          console.log('✅ Resolution data from API:', newResolutionFromApi);

          //   Import Home Slice to avoid circular dependencies
          const { addTaskToHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with API data
          dispatch(
            addTaskToHomeData({
              holidayId,
              task: newResolutionFromApi,
            }),
          );

          console.log(
            '✅ Resolution created and Home Slice updated:',
            newResolutionFromApi,
          );
        } catch (error) {
          // ❌ API failed - no state update needed, just log
          console.error('❌ Resolution creation failed:', error);
        }
      },
    }),
    createReservations: builder.mutation<
      any,
      { holidayId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'POST',
        body: { ...payload, category: 'Reservations' },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Reservations', id: holidayId },
      ],
    }),
    createCostumeIdeas: builder.mutation<
      any,
      { holidayId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'POST',
        body: { ...payload, category: 'Costume Ideas' },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'CostumeIdeas', id: holidayId },
      ],
    }),
    createTrickOrTreatPrep: builder.mutation<
      any,
      { holidayId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'POST',
        body: { ...payload, category: 'Trick or Treat Prep' },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'TrickOrTreatPrep', id: holidayId },
      ],
    }),
    createMealPlanning: builder.mutation<
      any,
      { holidayId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'POST',
        body: { ...payload, category: 'Meal Planning' },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'MealPlanning', id: holidayId },
      ],
    }),
    createPartyPlanning: builder.mutation<
      any,
      { holidayId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'POST',
        body: { ...payload, category: 'Party Planning' },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'PartyPlanning', id: holidayId },
      ],
    }),
    createBabyShowerGames: builder.mutation<
      any,
      { holidayId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'POST',
        body: { ...payload, category: 'Games' },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'BabyShowerGames', id: holidayId },
      ],
    }),
    createKwanzaaPrinciples: builder.mutation<
      any,
      { holidayId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'POST',
        body: { ...payload, category: 'Daily Principles' },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'KwanzaaPrinciples', id: holidayId },
      ],
      async onQueryStarted(
        { holidayId, payload, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🚀 Creating Kwanzaa principles task...', {
            holidayId,
            payload,
          });

          // ✅ Wait for successful API response
          const { data: response } = await queryFulfilled;

          // ✅ CRITICAL: Extract task from { data: task } format
          const newTaskFromApi = response.data.data;

          console.log('📦 Kwanzaa principles task response received:', response);
          console.log('✅ Kwanzaa principles task data from API:', newTaskFromApi);

          const { addTaskToHomeData } = await import('./slices/homeSlice');

          dispatch(
            addTaskToHomeData({
              holidayId,
              task: newTaskFromApi,
            }),
          );

          console.log(
            '✅ Kwanzaa principles task created and Home Slice updated:',
            newTaskFromApi,
          );
        } catch (error) {
          console.error('❌ Kwanzaa principles task creation failed:', error);
        }
      },
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
        method: 'PUT',
        body: { giftId, isCompleted },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Gifts', id: holidayId },
      ],
      // Traditional Redux pattern: wait for API success then update state
      async onQueryStarted(
        { holidayId, giftId, isCompleted, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🔄 Toggling gift completion...', {
            holidayId,
            giftId,
            isCompleted,
          });

          // Wait for API to succeed
          const { data: response } = await queryFulfilled;

          //   ✅ CRITICAL: Extract gift from { data: gift } format
          const updatedGiftFromApi = response.data.data;

          console.log('📦 Toggle gift response received:', response);
          console.log('✅ Updated gift data from API:', updatedGiftFromApi);

          // Import Home Slice actions to avoid circular dependencies
          const { updateGiftInHomeData } = await import('./slices/homeSlice');

          // Update Home Slice with server response
          if (updatedGiftFromApi) {
            dispatch(
              updateGiftInHomeData({
                holidayId,
                giftId,
                updates: updatedGiftFromApi,
              }),
            );

            console.log(
              '  Gift completion toggled and Home Slice updated:',
              updatedGiftFromApi,
            );
          }
        } catch (error) {
          // Let RTK Query handle the error state
          console.error('❌ Failed to update gift completion:', error);
        }
      },
    }),
    editGift: builder.mutation<
      any,
      { holidayId: string; giftId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, giftId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/gifts`,
        method: 'PATCH',
        body: { giftId, ...payload },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Gifts', id: holidayId },
      ],
      //   SAME PATTERN AS createGift: Traditional Redux pattern - wait for success, then update Home Slice
      async onQueryStarted(
        { holidayId, giftId, payload, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🔄 Editing gift...', { holidayId, giftId, payload });

          //   Wait for successful API response (no optimistic updates)
          const { data: response } = await queryFulfilled;

          //   ✅ CRITICAL: Extract gift from { data: gift } format
          const updatedGiftFromApi = response.data.data;

          console.log('📦 Edit gift response received:', response);
          console.log('✅ Updated gift data from API:', updatedGiftFromApi);

          //   Import Home Slice to avoid circular dependencies
          const { updateGiftInHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with API data (recipient field already correct)
          dispatch(
            updateGiftInHomeData({
              holidayId,
              giftId,
              updates: updatedGiftFromApi,
            }),
          );

          console.log('  Gift edited and Home Slice updated:', updatedGiftFromApi);
        } catch (error) {
          // ❌ API failed - no state update needed, just log
          console.error('❌ Gift edit failed:', error);
        }
      },
    }),
    deleteGift: builder.mutation<
      any,
      { holidayId: string; giftId: string; auth0User?: any }
    >({
      query: ({ holidayId, giftId, auth0User }) => ({
        url: `holidays/${holidayId}/gifts?giftId=${giftId}`,
        method: 'DELETE',
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      // Traditional Redux pattern: wait for API success then update state
      async onQueryStarted(
        { holidayId, giftId, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          // Wait for API to succeed
          await queryFulfilled;

          // Import Home Slice actions to avoid circular dependencies
          const { removeGiftFromHomeData } = await import('./slices/homeSlice');

          // Remove from Home Slice after successful deletion
          dispatch(
            removeGiftFromHomeData({
              holidayId,
              giftId,
            }),
          );
        } catch (error) {
          // Let RTK Query handle the error state
          console.error('Failed to delete gift:', error);
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
        method: 'PUT',
        body: { taskId, isCompleted },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Decorations', id: holidayId },
      ],
      //   Traditional Redux pattern - wait for success, then update Home Slice
      async onQueryStarted(
        { holidayId, taskId, isCompleted, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🔄 Updating decoration completion...', {
            holidayId,
            taskId,
            isCompleted,
          });

          //   Wait for successful API response (no optimistic updates)
          const { data: response } = await queryFulfilled;

          // 🚨 CRITICAL: Extract entity from { data: entity } format
          const updatedDecorationFromApi = response.data.data;

          console.log('📦 Update decoration response received:', response);
          console.log(
            '✅ Updated decoration data from API:',
            updatedDecorationFromApi,
          );

          //   Import Home Slice to avoid circular dependencies
          const { updateTaskInHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with API data
          dispatch(
            updateTaskInHomeData({
              holidayId,
              taskId: taskId,
              updates: updatedDecorationFromApi,
            }),
          );

          console.log(
            '✅ Decoration updated and Home Slice updated:',
            updatedDecorationFromApi,
          );
        } catch (error) {
          // ❌ API failed - no state update needed, just log
          console.error('❌ Decoration update failed:', error);
        }
      },
    }),
    editDecoration: builder.mutation<
      any,
      { holidayId: string; taskId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, taskId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'PATCH',
        body: { taskId, ...payload },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Decorations', id: holidayId },
      ],
      //   Traditional Redux pattern - wait for success, then update Home Slice
      async onQueryStarted(
        { holidayId, taskId, payload, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🔄 Editing decoration...', { holidayId, taskId, payload });

          //   Wait for successful API response (no optimistic updates)
          const { data: response } = await queryFulfilled;

          // 🚨 CRITICAL: Extract entity from { data: entity } format
          const updatedDecorationFromApi = response.data.data;

          console.log('📦 Edit decoration response received:', response);
          console.log(
            '✅ Updated decoration data from API:',
            updatedDecorationFromApi,
          );

          //   Import Home Slice to avoid circular dependencies
          const { updateTaskInHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with API data
          dispatch(
            updateTaskInHomeData({
              holidayId,
              taskId: taskId,
              updates: updatedDecorationFromApi,
            }),
          );

          console.log(
            '✅ Decoration edited and Home Slice updated:',
            updatedDecorationFromApi,
          );
        } catch (error) {
          // ❌ API failed - no state update needed, just log
          console.error('❌ Decoration edit failed:', error);
        }
      },
    }),
    deleteDecoration: builder.mutation<
      any,
      { holidayId: string; taskId: string; auth0User?: any }
    >({
      query: ({ holidayId, taskId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks?taskId=${taskId}`,
        method: 'DELETE',
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        { dispatch, queryFulfilled },
      ) {
        console.log(
          'Delete decoration optimistic update - holidayId:',
          holidayId,
          'taskId:',
          taskId,
        );

        // Optimistically update the cache by removing the deleted decoration
        const patchResult = dispatch(
          api.util.updateQueryData(
            'getDecorations',
            { holidayId, auth0User },
            draft => {
              console.log('UpdateQueryData callback - draft:', draft);
              if (draft) {
                const index = draft.findIndex(
                  (decoration: any) => decoration.id === taskId,
                );
                console.log('Found decoration at index:', index);
                if (index !== -1) {
                  draft.splice(index, 1);
                  console.log('Removed decoration from cache');
                } else {
                  console.log('Decoration not found in cache');
                }
              } else {
                console.log('No draft found - query data not available');
              }
            },
          ),
        );

        try {
          await queryFulfilled;
          console.log('Delete decoration query fulfilled successfully');
        } catch (error) {
          console.log(
            'Delete decoration query failed, reverting optimistic update:',
            error,
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
        method: 'PUT',
        body: { taskId, isCompleted },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Events', id: holidayId },
      ],
      //   Traditional Redux pattern - wait for success, then update Home Slice
      async onQueryStarted(
        { holidayId, taskId, isCompleted, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🔄 Updating event completion...', {
            holidayId,
            taskId,
            isCompleted,
          });

          //   Wait for successful API response (no optimistic updates)
          const { data: response } = await queryFulfilled;

          // 🚨 CRITICAL: Extract entity from { data: entity } format
          const updatedEventFromApi = response.data.data;

          console.log('📦 Update event response received:', response);
          console.log('✅ Updated event data from API:', updatedEventFromApi);

          //   Import Home Slice to avoid circular dependencies
          const { updateTaskInHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with API data
          dispatch(
            updateTaskInHomeData({
              holidayId,
              taskId: taskId,
              updates: updatedEventFromApi,
            }),
          );

          console.log(
            '✅ Event updated and Home Slice updated:',
            updatedEventFromApi,
          );
        } catch (error) {
          // ❌ API failed - no state update needed, just log
          console.error('❌ Event update failed:', error);
        }
      },
    }),
    editEvent: builder.mutation<
      any,
      { holidayId: string; taskId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, taskId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'PATCH',
        body: { taskId, ...payload },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Events', id: holidayId },
      ],
      //   Traditional Redux pattern - wait for success, then update Home Slice
      async onQueryStarted(
        { holidayId, taskId, payload, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🔄 Editing event...', { holidayId, taskId, payload });

          //   Wait for successful API response (no optimistic updates)
          const { data: response } = await queryFulfilled;

          // 🚨 CRITICAL: Extract entity from { data: entity } format
          const updatedEventFromApi = response.data.data;

          console.log('📦 Edit event response received:', response);
          console.log('✅ Updated event data from API:', updatedEventFromApi);

          //   Import Home Slice to avoid circular dependencies
          const { updateTaskInHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with API data
          dispatch(
            updateTaskInHomeData({
              holidayId,
              taskId: taskId,
              updates: updatedEventFromApi,
            }),
          );

          console.log(
            '✅ Event edited and Home Slice updated:',
            updatedEventFromApi,
          );
        } catch (error) {
          // ❌ API failed - no state update needed, just log
          console.error('❌ Event edit failed:', error);
        }
      },
    }),
    deleteEvent: builder.mutation<
      any,
      { holidayId: string; taskId: string; auth0User?: any }
    >({
      query: ({ holidayId, taskId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks?taskId=${taskId}`,
        method: 'DELETE',
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        { dispatch, queryFulfilled },
      ) {
        // Import sync utilities to avoid circular dependencies
        const { syncRemoveFromHomeSlice, syncAddToHomeSlice } =
          await import('./syncUtils');

        console.log(
          'Delete event optimistic update - holidayId:',
          holidayId,
          'taskId:',
          taskId,
        );

        // Store the deleted event data for rollback
        let deletedEvent: any = null;

        // 1.   Optimistic RTK Query cache update
        const patchResult = dispatch(
          api.util.updateQueryData('getEvents', { holidayId, auth0User }, draft => {
            console.log('UpdateQueryData callback - draft:', draft);
            if (draft) {
              const index = draft.findIndex((event: any) => event.id === taskId);
              console.log('Found event at index:', index);
              if (index !== -1) {
                // Store the event data before removal
                deletedEvent = { ...draft[index] };
                draft.splice(index, 1);
                console.log('Removed event from cache');
              } else {
                console.log('Event not found in cache');
              }
            } else {
              console.log('No draft found - query data not available');
            }
          }),
        );

        // 2.   NEW: Optimistic Home Slice sync
        syncRemoveFromHomeSlice({
          entityType: 'event',
          holidayId,
          entityId: taskId,
          dispatch,
        });

        try {
          await queryFulfilled;
          console.log('Delete event query fulfilled successfully');

          // 3.   Delete confirmed by server - no additional sync needed
        } catch (error) {
          console.log(
            'Delete event query failed, reverting optimistic update:',
            error,
          );

          // 4.   Revert both RTK Query cache and Home Slice on error
          patchResult.undo();
          if (deletedEvent) {
            syncAddToHomeSlice({
              entityType: 'event',
              holidayId,
              optimisticData: deletedEvent,
              dispatch,
            });
          }
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
        method: 'PUT',
        body: { taskId, isCompleted },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'CandleLighting', id: holidayId },
      ],
      //   Traditional Redux pattern - wait for success, then update Home Slice
      async onQueryStarted(
        { holidayId, taskId, isCompleted, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🔄 Updating candle lighting task completion...', {
            holidayId,
            taskId,
            isCompleted,
          });

          //   Wait for successful API response (no optimistic updates)
          const { data: response } = await queryFulfilled;

          // 🚨 CRITICAL: Extract entity from { data: entity } format
          const updatedTaskFromApi = response.data.data;

          console.log('📦 Update candle lighting response received:', response);
          console.log(
            '✅ Updated candle lighting data from API:',
            updatedTaskFromApi,
          );

          //   Import Home Slice to avoid circular dependencies
          const { updateTaskInHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with API data (candle lighting is a task category)
          dispatch(
            updateTaskInHomeData({
              holidayId,
              taskId,
              updates: updatedTaskFromApi,
            }),
          );

          console.log(
            '✅ Candle lighting task updated and Home Slice updated:',
            updatedTaskFromApi,
          );
        } catch (error) {
          // ❌ API failed - no state update needed, just log
          console.error('❌ Candle lighting task update failed:', error);
        }
      },
    }),
    editCandleLighting: builder.mutation<
      any,
      { holidayId: string; taskId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, taskId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'PATCH',
        body: { taskId, ...payload },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'CandleLighting', id: holidayId },
      ],
      //   Traditional Redux pattern - wait for success, then update Home Slice
      async onQueryStarted(
        { holidayId, taskId, payload, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🔄 Editing candle lighting task...', {
            holidayId,
            taskId,
            payload,
          });

          //   Wait for successful API response (no optimistic updates)
          const { data: response } = await queryFulfilled;

          // 🚨 CRITICAL: Extract entity from { data: entity } format
          const updatedTaskFromApi = response.data.data;

          console.log('📦 Edit candle lighting response received:', response);
          console.log(
            '✅ Updated candle lighting data from API:',
            updatedTaskFromApi,
          );

          //   Import Home Slice to avoid circular dependencies
          const { updateTaskInHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with API data (candle lighting is a task category)
          dispatch(
            updateTaskInHomeData({
              holidayId,
              taskId,
              updates: updatedTaskFromApi,
            }),
          );

          console.log(
            '✅ Candle lighting task edited and Home Slice updated:',
            updatedTaskFromApi,
          );
        } catch (error) {
          // ❌ API failed - no state update needed, just log
          console.error('❌ Candle lighting task edit failed:', error);
        }
      },
    }),
    deleteCandleLighting: builder.mutation<
      any,
      { holidayId: string; taskId: string; auth0User?: any }
    >({
      query: ({ holidayId, taskId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks?taskId=${taskId}`,
        method: 'DELETE',
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        { dispatch, queryFulfilled },
      ) {
        const patchResult = dispatch(
          api.util.updateQueryData(
            'getCandleLighting',
            { holidayId, auth0User },
            draft => {
              if (draft) {
                const index = draft.findIndex((task: any) => task.id === taskId);
                if (index !== -1) {
                  draft.splice(index, 1);
                }
              }
            },
          ),
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
        method: 'PUT',
        body: { taskId, isCompleted },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'DateIdeas', id: holidayId },
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
        method: 'PUT',
        body: { taskId, isCompleted },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Resolutions', id: holidayId },
      ],
      //   Traditional Redux pattern - wait for success, then update Home Slice
      async onQueryStarted(
        { holidayId, taskId, isCompleted, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🚀 Updating resolution...', {
            holidayId,
            taskId,
            isCompleted,
          });

          //   Wait for successful API response (no optimistic updates)
          const { data: response } = await queryFulfilled;

          // 🚨 CRITICAL: Extract entity from { data: entity } format
          const updatedResolutionFromApi = response.data.data;

          console.log('📦 Resolution update response received:', response);
          console.log(
            '✅ Updated resolution data from API:',
            updatedResolutionFromApi,
          );

          //   Import Home Slice to avoid circular dependencies
          const { updateTaskInHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with API data
          dispatch(
            updateTaskInHomeData({
              holidayId,
              taskId: taskId,
              updates: updatedResolutionFromApi,
            }),
          );

          console.log(
            '✅ Resolution updated and Home Slice updated:',
            updatedResolutionFromApi,
          );
        } catch (error) {
          // ❌ API failed - no state update needed, just log
          console.error('❌ Resolution update failed:', error);
        }
      },
    }),
    editDateIdeas: builder.mutation<
      any,
      { holidayId: string; taskId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, taskId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'PATCH',
        body: { taskId, ...payload },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'DateIdeas', id: holidayId },
      ],
    }),
    editResolutions: builder.mutation<
      any,
      { holidayId: string; taskId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, taskId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'PATCH',
        body: { taskId, ...payload },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Resolutions', id: holidayId },
      ],
      //   Traditional Redux pattern - wait for success, then update Home Slice
      async onQueryStarted(
        { holidayId, taskId, payload, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🚀 Editing resolution...', { holidayId, taskId, payload });

          //   Wait for successful API response (no optimistic updates)
          const { data: response } = await queryFulfilled;

          // 🚨 CRITICAL: Extract entity from { data: entity } format
          const updatedResolutionFromApi = response.data.data;

          console.log('📦 Resolution edit response received:', response);
          console.log(
            '✅ Updated resolution data from API:',
            updatedResolutionFromApi,
          );

          //   Import Home Slice to avoid circular dependencies
          const { updateTaskInHomeData } = await import('./slices/homeSlice');

          //   Update Home Slice with API data
          dispatch(
            updateTaskInHomeData({
              holidayId,
              taskId: taskId,
              updates: updatedResolutionFromApi,
            }),
          );

          console.log(
            '✅ Resolution edited and Home Slice updated:',
            updatedResolutionFromApi,
          );
        } catch (error) {
          // ❌ API failed - no state update needed, just log
          console.error('❌ Resolution edit failed:', error);
        }
      },
    }),
    deleteDateIdeas: builder.mutation<
      any,
      { holidayId: string; taskId: string; auth0User?: any }
    >({
      query: ({ holidayId, taskId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks?taskId=${taskId}`,
        method: 'DELETE',
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        { dispatch, queryFulfilled },
      ) {
        const patchResult = dispatch(
          api.util.updateQueryData(
            'getDateIdeas',
            { holidayId, auth0User },
            draft => {
              if (draft) {
                const index = draft.findIndex((task: any) => task.id === taskId);
                if (index !== -1) {
                  draft.splice(index, 1);
                }
              }
            },
          ),
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
        method: 'DELETE',
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        { dispatch, queryFulfilled },
      ) {
        const patchResult = dispatch(
          api.util.updateQueryData(
            'getResolutions',
            { holidayId, auth0User },
            draft => {
              if (draft) {
                const index = draft.findIndex((task: any) => task.id === taskId);
                if (index !== -1) {
                  draft.splice(index, 1);
                }
              }
            },
          ),
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
        method: 'PUT',
        body: { taskId, isCompleted },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Reservations', id: holidayId },
      ],
    }),
    editReservations: builder.mutation<
      any,
      { holidayId: string; taskId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, taskId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'PATCH',
        body: { taskId, ...payload },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'Reservations', id: holidayId },
      ],
    }),
    deleteReservations: builder.mutation<
      any,
      { holidayId: string; taskId: string; auth0User?: any }
    >({
      query: ({ holidayId, taskId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks?taskId=${taskId}`,
        method: 'DELETE',
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        { dispatch, queryFulfilled },
      ) {
        const patchResult = dispatch(
          api.util.updateQueryData(
            'getReservations',
            { holidayId, auth0User },
            draft => {
              if (draft) {
                const index = draft.findIndex((task: any) => task.id === taskId);
                if (index !== -1) {
                  draft.splice(index, 1);
                }
              }
            },
          ),
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
        method: 'PUT',
        body: { taskId, isCompleted },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'CostumeIdeas', id: holidayId },
      ],
    }),
    editCostumeIdeas: builder.mutation<
      any,
      { holidayId: string; taskId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, taskId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'PATCH',
        body: { taskId, ...payload },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'CostumeIdeas', id: holidayId },
      ],
    }),
    deleteCostumeIdeas: builder.mutation<
      any,
      { holidayId: string; taskId: string; auth0User?: any }
    >({
      query: ({ holidayId, taskId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks?taskId=${taskId}`,
        method: 'DELETE',
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        { dispatch, queryFulfilled },
      ) {
        const patchResult = dispatch(
          api.util.updateQueryData(
            'getCostumeIdeas',
            { holidayId, auth0User },
            draft => {
              if (draft) {
                const index = draft.findIndex((task: any) => task.id === taskId);
                if (index !== -1) {
                  draft.splice(index, 1);
                }
              }
            },
          ),
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
        method: 'PUT',
        body: { taskId, isCompleted },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'TrickOrTreatPrep', id: holidayId },
      ],
    }),
    editTrickOrTreatPrep: builder.mutation<
      any,
      { holidayId: string; taskId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, taskId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'PATCH',
        body: { taskId, ...payload },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'TrickOrTreatPrep', id: holidayId },
      ],
    }),
    deleteTrickOrTreatPrep: builder.mutation<
      any,
      { holidayId: string; taskId: string; auth0User?: any }
    >({
      query: ({ holidayId, taskId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks?taskId=${taskId}`,
        method: 'DELETE',
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        { dispatch, queryFulfilled },
      ) {
        const patchResult = dispatch(
          api.util.updateQueryData(
            'getTrickOrTreatPrep',
            { holidayId, auth0User },
            draft => {
              if (draft) {
                const index = draft.findIndex((task: any) => task.id === taskId);
                if (index !== -1) {
                  draft.splice(index, 1);
                }
              }
            },
          ),
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
        method: 'PUT',
        body: { taskId, isCompleted },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'MealPlanning', id: holidayId },
      ],
    }),
    editMealPlanning: builder.mutation<
      any,
      { holidayId: string; taskId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, taskId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'PATCH',
        body: { taskId, ...payload },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'MealPlanning', id: holidayId },
      ],
    }),
    deleteMealPlanning: builder.mutation<
      any,
      { holidayId: string; taskId: string; auth0User?: any }
    >({
      query: ({ holidayId, taskId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks?taskId=${taskId}`,
        method: 'DELETE',
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        { dispatch, queryFulfilled },
      ) {
        const patchResult = dispatch(
          api.util.updateQueryData(
            'getMealPlanning',
            { holidayId, auth0User },
            draft => {
              if (draft) {
                const index = draft.findIndex((task: any) => task.id === taskId);
                if (index !== -1) {
                  draft.splice(index, 1);
                }
              }
            },
          ),
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
        method: 'PUT',
        body: { taskId, isCompleted },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'PartyPlanning', id: holidayId },
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
        method: 'PUT',
        body: { taskId, isCompleted },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'BabyShowerGames', id: holidayId },
      ],
    }),
    editPartyPlanning: builder.mutation<
      any,
      { holidayId: string; taskId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, taskId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'PATCH',
        body: { taskId, ...payload },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'PartyPlanning', id: holidayId },
      ],
    }),
    editBabyShowerGames: builder.mutation<
      any,
      { holidayId: string; taskId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, taskId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'PATCH',
        body: { taskId, ...payload },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'BabyShowerGames', id: holidayId },
      ],
    }),
    deletePartyPlanning: builder.mutation<
      any,
      { holidayId: string; taskId: string; auth0User?: any }
    >({
      query: ({ holidayId, taskId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks?taskId=${taskId}`,
        method: 'DELETE',
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        { dispatch, queryFulfilled },
      ) {
        const patchResult = dispatch(
          api.util.updateQueryData(
            'getPartyPlanning',
            { holidayId, auth0User },
            draft => {
              if (draft) {
                const index = draft.findIndex((task: any) => task.id === taskId);
                if (index !== -1) {
                  draft.splice(index, 1);
                }
              }
            },
          ),
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
        method: 'DELETE',
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        { dispatch, queryFulfilled },
      ) {
        const patchResult = dispatch(
          api.util.updateQueryData(
            'getBabyShowerGames',
            { holidayId, auth0User },
            draft => {
              if (draft) {
                const index = draft.findIndex((task: any) => task.id === taskId);
                if (index !== -1) {
                  draft.splice(index, 1);
                }
              }
            },
          ),
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
        method: 'PUT',
        body: { taskId, isCompleted },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'KwanzaaPrinciples', id: holidayId },
      ],
      async onQueryStarted(
        { holidayId, taskId, isCompleted, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🔄 Toggling Kwanzaa principles task completion...', {
            holidayId,
            taskId,
            isCompleted,
          });

          // ✅ Wait for successful API response
          const { data: response } = await queryFulfilled;

          // ✅ CRITICAL: Extract task from { data: task } format
          const updatedTaskFromApi = response.data.data;

          console.log(
            '📦 Updated Kwanzaa principles task response received:',
            response,
          );
          console.log(
            '✅ Updated Kwanzaa principles task data from API:',
            updatedTaskFromApi,
          );

          const { updateTaskInHomeData } = await import('./slices/homeSlice');

          dispatch(
            updateTaskInHomeData({
              holidayId,
              taskId,
              updates: updatedTaskFromApi,
            }),
          );

          console.log(
            '✅ Kwanzaa principles task toggled and Home Slice updated:',
            updatedTaskFromApi,
          );
        } catch (error) {
          console.error('❌ Kwanzaa principles task toggle failed:', error);
        }
      },
    }),
    editKwanzaaPrinciples: builder.mutation<
      any,
      { holidayId: string; taskId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, taskId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/tasks`,
        method: 'PATCH',
        body: { taskId, ...payload },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      invalidatesTags: (result, error, { holidayId }) => [
        { type: 'KwanzaaPrinciples', id: holidayId },
      ],
      async onQueryStarted(
        { holidayId, taskId, payload, auth0User },
        { dispatch, queryFulfilled },
      ) {
        try {
          console.log('🔄 Editing Kwanzaa principles task...', {
            holidayId,
            taskId,
            payload,
          });

          // ✅ Wait for successful API response
          const { data: response } = await queryFulfilled;

          // ✅ CRITICAL: Extract task from { data: task } format
          const updatedTaskFromApi = response.data.data;

          console.log(
            '📦 Edit Kwanzaa principles task response received:',
            response,
          );
          console.log(
            '✅ Updated Kwanzaa principles task data from API:',
            updatedTaskFromApi,
          );

          const { updateTaskInHomeData } = await import('./slices/homeSlice');

          dispatch(
            updateTaskInHomeData({
              holidayId,
              taskId,
              updates: updatedTaskFromApi,
            }),
          );

          console.log(
            '✅ Kwanzaa principles task edited and Home Slice updated:',
            updatedTaskFromApi,
          );
        } catch (error) {
          console.error('❌ Kwanzaa principles task edit failed:', error);
        }
      },
    }),
    deleteKwanzaaPrinciples: builder.mutation<
      any,
      { holidayId: string; taskId: string; auth0User?: any }
    >({
      query: ({ holidayId, taskId, auth0User }) => ({
        url: `holidays/${holidayId}/tasks?taskId=${taskId}`,
        method: 'DELETE',
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        { dispatch, queryFulfilled },
      ) {
        const patchResult = dispatch(
          api.util.updateQueryData(
            'getKwanzaaPrinciples',
            { holidayId, auth0User },
            draft => {
              if (draft) {
                const index = draft.findIndex((task: any) => task.id === taskId);
                if (index !== -1) {
                  draft.splice(index, 1);
                }
              }
            },
          ),
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
        method: 'PUT',
        body: { guestId, isCompleted },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      // NOTE: No invalidatesTags since we manually update Home Slice in onQueryStarted
      // Optimistic update for update guest
      async onQueryStarted(
        { holidayId, guestId, isCompleted, auth0User },
        { dispatch, queryFulfilled },
      ) {
        // Import sync utilities to avoid circular dependencies
        const { syncUpdateInHomeSlice } = await import('./syncUtils');

        // Store original guest for rollback
        let originalGuest: any = null;

        // 1.   Optimistic RTK Query cache update
        const patchResult = dispatch(
          api.util.updateQueryData(
            'getGuestList',
            { holidayId, auth0User },
            draft => {
              if (draft) {
                const guest = draft.find((g: any) => g.id === guestId);
                if (guest) {
                  // Store original for rollback
                  originalGuest = { ...guest };
                  guest.isCompleted = isCompleted;
                  // Update RSVP status based on completion state
                  guest.rsvpStatus = isCompleted ? 'confirmed' : 'pending';
                  guest.completedDate = isCompleted
                    ? new Date().toISOString()
                    : null;
                  guest.updatedAt = new Date().toISOString();
                }
              }
            },
          ),
        );

        // 2.   NEW: Optimistic Home Slice sync
        if (originalGuest) {
          const optimisticUpdate = {
            ...originalGuest,
            isCompleted,
            rsvpStatus: isCompleted ? 'confirmed' : 'pending',
            completedDate: isCompleted ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString(),
          };

          syncUpdateInHomeSlice({
            entityType: 'guest',
            holidayId,
            entityId: guestId,
            serverData: optimisticUpdate,
            dispatch,
          });
        }

        try {
          const { data: serverGuest } = await queryFulfilled;

          // 3.   NEW: Update Home Slice with actual server data if different
          if (serverGuest) {
            syncUpdateInHomeSlice({
              entityType: 'guest',
              holidayId,
              entityId: guestId,
              serverData: serverGuest,
              dispatch,
            });
          }
        } catch (error) {
          // 4.   Revert both RTK Query cache and Home Slice on error
          patchResult.undo();
          if (originalGuest) {
            syncUpdateInHomeSlice({
              entityType: 'guest',
              holidayId,
              entityId: guestId,
              serverData: originalGuest,
              dispatch,
            });
          }
        }
      },
    }),
    editGuest: builder.mutation<
      any,
      { holidayId: string; guestId: string; payload: any; auth0User?: any }
    >({
      query: ({ holidayId, guestId, payload, auth0User }) => ({
        url: `holidays/${holidayId}/guest-lists`,
        method: 'PATCH',
        body: { guestId, ...payload },
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            }
          : {},
      }),
      // NOTE: No invalidatesTags since we manually update Home Slice in the component
      // Optimistic RTK Query cache update only - Home Slice handled manually in component
      async onQueryStarted(
        { holidayId, guestId, payload, auth0User },
        { dispatch, queryFulfilled },
      ) {
        // Store original guest for rollback
        let originalGuest: any = null;

        // 1. Optimistic RTK Query cache update only
        const patchResult = dispatch(
          api.util.updateQueryData(
            'getGuestList',
            { holidayId, auth0User },
            draft => {
              if (draft) {
                const guest = draft.find((g: any) => g.id === guestId);
                if (guest) {
                  // Store original for rollback
                  originalGuest = { ...guest };
                  Object.assign(guest, payload);
                  guest.updatedAt = new Date().toISOString();
                }
              }
            },
          ),
        );

        try {
          const { data: response } = await queryFulfilled;

          // ✅ CRITICAL: Extract guest from { success: true, data: guest } format
          const serverGuest = response.data;

          console.log('📦 Edit guest response received:', response);
          console.log('✅ Guest data from API:', serverGuest);

          // NOTE: Home Slice updates handled manually in component
        } catch (error) {
          // Revert RTK Query cache on error
          patchResult.undo();
          console.error('❌ Guest edit failed:', error);
        }
      },
    }),
    deleteGuest: builder.mutation<
      any,
      { holidayId: string; guestId: string; auth0User?: any }
    >({
      query: ({ holidayId, guestId, auth0User }) => ({
        url: `holidays/${holidayId}/guest-lists?guestId=${guestId}`,
        method: 'DELETE',
        headers: auth0User
          ? {
              'x-test-user': JSON.stringify({
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
        { dispatch, queryFulfilled },
      ) {
        // Import sync utilities to avoid circular dependencies
        const { syncRemoveFromHomeSlice, syncAddToHomeSlice } =
          await import('./syncUtils');

        console.log(
          'Delete guest optimistic update - holidayId:',
          holidayId,
          'guestId:',
          guestId,
        );

        // Store the deleted guest data for rollback
        let deletedGuest: any = null;

        // 1.   Optimistic RTK Query cache update
        const patchResult = dispatch(
          api.util.updateQueryData(
            'getGuestList',
            { holidayId, auth0User },
            draft => {
              console.log('UpdateQueryData callback - draft:', draft);
              if (draft) {
                const index = draft.findIndex((guest: any) => guest.id === guestId);
                console.log('Found guest at index:', index);
                if (index !== -1) {
                  // Store the guest data before removal
                  deletedGuest = { ...draft[index] };
                  draft.splice(index, 1);
                  console.log('Removed guest from cache');
                } else {
                  console.log('Guest not found in cache');
                }
              } else {
                console.log('No draft found - query data not available');
              }
            },
          ),
        );

        // 2.   NEW: Optimistic Home Slice sync
        syncRemoveFromHomeSlice({
          entityType: 'guest',
          holidayId,
          entityId: guestId,
          dispatch,
        });

        try {
          await queryFulfilled;
          console.log('Delete guest query fulfilled successfully');

          // 3.   Delete confirmed by server - no additional sync needed
        } catch (error) {
          console.log(
            'Delete guest query failed, reverting optimistic update:',
            error,
          );

          // 4.   Revert both RTK Query cache and Home Slice on error
          patchResult.undo();
          if (deletedGuest) {
            syncAddToHomeSlice({
              entityType: 'guest',
              holidayId,
              optimisticData: deletedGuest,
              dispatch,
            });
          }
        }
      },
    }),
  }),
});

export const {
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useToggleTaskCompletionMutation,
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
  useGetAllGiftsQuery,
  useGetCardsQuery,
  useGetAllCardsQuery,
  useGetTasksQuery,
  useGetAllTasksQuery,
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
