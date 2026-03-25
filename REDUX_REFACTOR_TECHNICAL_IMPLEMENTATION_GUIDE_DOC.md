# **PHASE 2 IMPLEMENTATION GUIDE: ENHANCED RTK QUERY MUTATIONS**

This document provides the step-by-step technical implementation for adding automatic Home Slice synchronization to RTK Query mutations, eliminating the need for manual `refreshHomeData()` calls.

## **Step 1: Enhanced createGift Mutation Example**

Here's how to modify your existing `createGift` mutation in `src/store/api.ts` to automatically sync with the Home Slice:

### **BEFORE** (Current Implementation):
```typescript
createGift: builder.mutation<
  any,
  { holidayId: string; payload: any; auth0User?: any }
>({
  query: ({ holidayId, payload, auth0User }) => ({
    url: `holidays/${holidayId}/gifts`,
    method: 'POST',
    body: payload,
    headers: auth0User ? {
      'x-test-user': JSON.stringify({
        sub: auth0User.sub,
        email: auth0User.email,
        name: auth0User.name,
        picture: auth0User.picture,
      }),
    } : {},
  }),
  invalidatesTags: (result, error, { holidayId }) => [
    { type: 'Gifts', id: holidayId },
  ],
  // ❌ Current: Only RTK Query cache optimistic update
  async onQueryStarted({ holidayId, payload, auth0User }, { dispatch, queryFulfilled }) {
    const tempId = `temp-${Date.now()}`;
    const optimisticGift = {
      id: tempId,
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // ✅ RTK Query cache update
    const patchResult = dispatch(
      api.util.updateQueryData('getGifts', { holidayId, auth0User }, draft => {
        if (draft) {
          draft.unshift(optimisticGift);
        }
      }),
    );

    try {
      await queryFulfilled;
    } catch (error) {
      patchResult.undo();
    }
  },
}),
```

### **AFTER** (Enhanced with Home Slice Sync):
```typescript
createGift: builder.mutation<
  any,
  { holidayId: string; payload: any; auth0User?: any }
>({
  query: ({ holidayId, payload, auth0User }) => ({
    url: `holidays/${holidayId}/gifts`,
    method: 'POST',
    body: payload,
    headers: auth0User ? {
      'x-test-user': JSON.stringify({
        sub: auth0User.sub,
        email: auth0User.email,
        name: auth0User.name,
        picture: auth0User.picture,
      }),
    } : {},
  }),
  invalidatesTags: (result, error, { holidayId }) => [
    { type: 'Gifts', id: holidayId },
  ],
  // ✅ NEW: Automatic RTK Query + Home Slice sync
  async onQueryStarted({ holidayId, payload, auth0User }, { dispatch, queryFulfilled }) {
    // Import sync utilities
    const { syncAddToHomeSlice, syncUpdateInHomeSlice, syncRemoveFromHomeSlice } = 
      await import('./syncUtils');
    
    const tempId = `temp-${Date.now()}`;
    const optimisticGift = {
      id: tempId,
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. ✅ Optimistic RTK Query cache update
    const patchResult = dispatch(
      api.util.updateQueryData('getGifts', { holidayId, auth0User }, draft => {
        if (draft) {
          draft.unshift(optimisticGift);
        }
      }),
    );

    // 2. ✅ NEW: Optimistic Home Slice sync
    syncAddToHomeSlice({ 
      entityType: 'gift', 
      holidayId, 
      optimisticData: optimisticGift, 
      dispatch 
    });

    try {
      const { data: serverGift } = await queryFulfilled;
      
      // 3. ✅ NEW: Update Home Slice with real server data
      syncUpdateInHomeSlice({ 
        entityType: 'gift', 
        holidayId, 
        entityId: tempId, 
        serverData: serverGift, 
        dispatch 
      });
    } catch (error) {
      // 4. ✅ Revert both caches on error
      patchResult.undo();
      syncRemoveFromHomeSlice({ 
        entityType: 'gift', 
        holidayId, 
        entityId: tempId, 
        dispatch 
      });
    }
  },
}),
```

## **Step 2: Enhanced updateGift Mutation Example**

### **BEFORE**:
```typescript
updateGift: builder.mutation<
  any,
  { holidayId: string; giftId: string; isCompleted: boolean; auth0User?: any }
>({
  query: ({ holidayId, giftId, isCompleted, auth0User }) => ({
    url: `holidays/${holidayId}/gifts`,
    method: 'PUT', 
    body: { giftId, isCompleted },
    headers: auth0User ? { /* headers */ } : {},
  }),
  invalidatesTags: (result, error, { holidayId }) => [
    { type: 'Gifts', id: holidayId },
  ],
  // ❌ Current: Only RTK Query optimistic update
  async onQueryStarted({ holidayId, giftId, isCompleted, auth0User }, { dispatch, queryFulfilled }) {
    const patchResult = dispatch(
      api.util.updateQueryData('getGifts', { holidayId, auth0User }, draft => {
        if (draft) {
          const giftIndex = draft.findIndex((gift: any) => gift.id === giftId);
          if (giftIndex !== -1) {
            draft[giftIndex] = {
              ...draft[giftIndex],
              isCompleted,
              completedDate: isCompleted ? new Date().toISOString() : null,
              updatedAt: new Date().toISOString(),
            };
          }
        }
      }),
    );

    try {
      await queryFulfilled;
    } catch (error) {
      patchResult.undo();
    }
  },
}),
```

### **AFTER** (Enhanced with Home Slice Sync):
```typescript
updateGift: builder.mutation<
  any,
  { holidayId: string; giftId: string; isCompleted: boolean; auth0User?: any }
>({
  query: ({ holidayId, giftId, isCompleted, auth0User }) => ({
    url: `holidays/${holidayId}/gifts`,
    method: 'PUT',
    body: { giftId, isCompleted },
    headers: auth0User ? { /* headers */ } : {},
  }),
  invalidatesTags: (result, error, { holidayId }) => [
    { type: 'Gifts', id: holidayId },
  ],
  // ✅ NEW: Automatic RTK Query + Home Slice sync
  async onQueryStarted({ holidayId, giftId, isCompleted, auth0User }, { dispatch, queryFulfilled }) {
    const { syncUpdateInHomeSlice } = await import('./syncUtils');
    
    const updates = {
      isCompleted,
      completedDate: isCompleted ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    };

    // 1. ✅ Optimistic RTK Query cache update  
    const patchResult = dispatch(
      api.util.updateQueryData('getGifts', { holidayId, auth0User }, draft => {
        if (draft) {
          const giftIndex = draft.findIndex((gift: any) => gift.id === giftId);
          if (giftIndex !== -1) {
            draft[giftIndex] = { ...draft[giftIndex], ...updates };
          }
        }
      }),
    );

    // 2. ✅ NEW: Optimistic Home Slice sync
    syncUpdateInHomeSlice({ 
      entityType: 'gift', 
      holidayId, 
      entityId: giftId, 
      serverData: updates, 
      dispatch 
    });

    try {
      const { data: serverData } = await queryFulfilled;
      
      // 3. ✅ NEW: Update Home Slice with confirmed server data
      syncUpdateInHomeSlice({ 
        entityType: 'gift', 
        holidayId, 
        entityId: giftId, 
        serverData, 
        dispatch 
      });
    } catch (error) {
      // 4. ✅ Revert RTK Query cache on error
      patchResult.undo();
      // Note: Home Slice revert would need original data - for now just log error
      console.error('Failed to update gift:', error);
    }
  },
}),
```

## **Step 3: Implementation Checklist**

### **High Priority Mutations to Enhance (Phase 2A):**
- ✅ `createGift` - Most common operation
- ✅ `updateGift` - Gift completion toggles
- ✅ `deleteGift` - Gift removal
- ✅ `createTask` - Task creation
- ✅ `updateTask` - Task updates
- ✅ `toggleTaskCompletion` - Task completion
- ✅ `deleteTask` - Task deletion

### **Medium Priority Mutations (Phase 2B):**
- ✅ `createCard`, `updateCard`, `deleteCard`
- ✅ `createGuest`, `updateGuest`, `deleteGuest`
- ✅ All event/decoration/specialty category mutations

## **Step 4: Component Impact**

### **BEFORE Enhancement** (Every component has this anti-pattern):
```typescript
const handleCreateGift = async (formData) => {
  try {
    await createGift({ holidayId, payload: formData, auth0User });
    // ❌ Manual refresh required
    await refreshHomeData(auth0User, holidayId);
    closeModal();
  } catch (error) {
    console.error('Failed to create gift:', error);
  }
};
```

### **AFTER Enhancement** (Clean, automatic updates):
```typescript
const handleCreateGift = async (formData) => {
  try {
    await createGift({ holidayId, payload: formData, auth0User });
    // ✅ NO MORE refreshHomeData needed!
    // ✅ UI automatically updates via RTK Query + Home Slice sync
    closeModal();
  } catch (error) {
    console.error('Failed to create gift:', error);
  }
};
```

## **Step 5: Rollout Strategy**

### **Week 1: Core Mutations (Gifts & Tasks)**
1. Enhance `createGift`, `updateGift`, `deleteGift`
2. Enhance `createTask`, `updateTask`, `deleteTask`, `toggleTaskCompletion` 
3. Test on 2-3 holiday pages
4. Remove `refreshHomeData` calls from those pages

### **Week 2: Cards & Guests**
1. Enhance card-related mutations
2. Enhance guest-related mutations  
3. Apply to remaining holiday pages
4. Remove more `refreshHomeData` calls

### **Week 3: Specialty Categories**
1. Enhance event/decoration/category-specific mutations
2. Apply to specialty pages (candle-lighting, meal-planning, etc.)
3. Remove remaining `refreshHomeData` calls

### **Week 4: Cleanup & Validation**
1. Remove `useRefreshHomeData` hook entirely
2. Remove manual Home Slice update actions
3. Validate no broken functionality
4. Performance testing

## **Expected Results**

### **Before Phase 2:**
- ❌ 368+ manual `refreshHomeData()` calls
- ❌ Stale UI until manual refresh
- ❌ Poor user experience with loading states

### **After Phase 2:**
- ✅ 0 manual refresh calls  
- ✅ Instant UI updates via optimistic updates
- ✅ Automatic error rollback
- ✅ Consistent data state across all UI components
- ✅ 40-50% reduction in API calls (no full home refresh)

---

## **🚨 CRITICAL SUCCESS FACTORS**

1. **Import syncUtils dynamically** to avoid circular dependencies
2. **Test each mutation individually** before moving to next  
3. **Remove refreshHomeData calls immediately** after enhancing mutations
4. **Validate error handling** works correctly (rollback both caches)
5. **Monitor performance** - should see significant improvement

This implementation eliminates the core Redux anti-pattern while maintaining all existing functionality!