# Unused Files Analysis Results

## Confirmed Unused Files

### Example/Demo Components
1. **src/components/examples/GamifiedHolidayCardExample.tsx** - Not imported anywhere
2. **src/components/cards/gift/GiftCardExample.tsx** - Not imported anywhere  
3. **src/components/cards/gift/GiftCardItemExample.tsx** - Not imported anywhere
4. **src/components/cards/holiday-task/HolidayTaskCardExample.tsx** - Not imported anywhere

### Utility Files
5. **src/utils/mockDb.ts** - Not imported anywhere, contains mock database interfaces
6. **src/types/http.ts** - Not imported anywhere, contains API response types

### Index Files (Potentially Unused)
7. **src/components/cards/shopping/index.ts** - Only exports ShoppingListItems, but components import directly
8. **src/components/cards/event/index.ts** - Only exports EventItems, but components import directly  
9. **src/components/cards/decorations/index.ts** - Only exports DecorationsListItem, but components import directly
10. **src/components/cards/recipe/index.ts** - Only exports recipe components, but components import directly
11. **src/components/cards/reservation/index.ts** - Only exports reservation components, but components import directly

## Files That Are Used (Confirmed)

### Core Utilities (All Used)
- ✅ **src/utils/cardShadows.ts** - Used in 20+ components
- ✅ **src/utils/gamifiedUtils.ts** - Used in 6+ card components  
- ✅ **src/utils/holidayGiftListConfig.ts** - Used in GiftListCard
- ✅ **src/utils/randomAnimations.ts** - Used in BouncingShape
- ✅ **src/utils/shareMigration.ts** - Used in AlertsBell component
- ✅ **src/utils/formValidation.ts** - Used in FormModal
- ✅ **src/utils/formTransformers.ts** - Used in 20+ page components
- ✅ **src/utils/holidayUtils.ts** - Used in 50+ page components
- ✅ **src/utils/holidayData.ts** - Used throughout the app

### Core Libraries (All Used)  
- ✅ **src/lib/traceFetch.ts** - Used in layout.tsx
- ✅ **src/lib/traceRTK.ts** - Used in store/api.ts
- ✅ **src/lib/tracePrisma.ts** - Used in lib/prisma.ts

### Types (Partially Used)
- ✅ **src/types/home.ts** - Used in 5+ files including HomeContent, HomePageWrapper
- ❌ **src/types/http.ts** - No imports found

### Components
- ✅ **src/components/animations/BouncingShape.tsx** - Used in HolidayCard
- ✅ **src/components/common/index.ts** - Only exports RSVPSection but not used as index

## Summary

**Total Unused Files: 11**
- 4 Example/Demo components that were likely created for testing/reference
- 1 Mock database utility no longer used  
- 1 HTTP types file not imported
- 5 Index files that don't provide value (components are imported directly)

**Safe to Remove:**
All files listed above can be safely removed without breaking functionality. The example components were likely created for development/testing purposes, and the index files are not being used as proper barrel exports.

**File Size Impact:**
Removing these files would clean up the codebase and reduce bundle size, though the impact is likely minimal since they're not imported.