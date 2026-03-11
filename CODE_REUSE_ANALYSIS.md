# Code Reuse & Duplication Analysis - Next Holiday App

## **PROJECT OVERVIEW**

- **Total Files Analyzed:** 70+ holiday pages, 65+ components
- **Current Codebase Size:** ~55,000 lines of TypeScript/TSX
- **Estimated Reduction Potential:** ~29,400+ lines (53% reduction)

---

## **LARGE COMPONENTS (Over ~150 Lines)**

| File                                                                                   | Lines     | Type              | Issues                                |
| -------------------------------------------------------------------------------------- | --------- | ----------------- | ------------------------------------- |
| [data/holidayShapes.tsx](src/data/holidayShapes.tsx)                                   | **1,374** | SVG Library       | Should be split into individual files |
| [components/common/AlertsBell.tsx](src/components/common/AlertsBell.tsx)               | **930**   | Complex Component | Needs decomposition                   |
| [app/birthday/party-planning/page.tsx](src/app/birthday/party-planning/page.tsx)       | **900**   | Holiday Page      | Template candidate                    |
| [app/kwanzaa/events/page.tsx](src/app/kwanzaa/events/page.tsx)                         | **893**   | Holiday Page      | Template candidate                    |
| [app/hanukkah/decorations/page.tsx](src/app/hanukkah/decorations/page.tsx)             | **856**   | Holiday Page      | Template candidate                    |
| [app/easter/events/page.tsx](src/app/easter/events/page.tsx)                           | **823**   | Holiday Page      | Template candidate                    |
| [app/valentines/reservations/page.tsx](src/app/valentines/reservations/page.tsx)       | **822**   | Holiday Page      | Template candidate                    |
| [app/settings/page.tsx](src/app/settings/page.tsx)                                     | **804**   | Settings Page     | Needs modularization                  |
| [app/hanukkah/candle-lighting/page.tsx](src/app/hanukkah/candle-lighting/page.tsx)     | **808**   | Holiday Page      | Template candidate                    |
| [app/thanksgiving/meal-planning/page.tsx](src/app/thanksgiving/meal-planning/page.tsx) | **801**   | Holiday Page      | Template candidate                    |

---

## **DUPLICATED PATTERNS IDENTIFIED**

### **1. Holiday Page Setup Pattern**

**Found in:** 70+ holiday pages  
**Duplication:**

```tsx
// Repeated in every holiday page (150-200 lines each)
const dispatch = useAppDispatch();
const { contacts } = useAppSelector((state: any) => state.addressBook);
const { holidayId, auth0User } = useFormModalMutation();
const holidayPreferences = useAppSelector(selectHolidayPreferences);
const homeInitialized = useAppSelector(selectHomeInitialized);
const homeData = useAppSelector(selectHomeData);
const isHolidayShared = useAppSelector((state: any) =>
  selectIsHolidayShared(state, 'holiday-name'),
);

// Redux data access
const holidayData = useAppSelector(state => selectHolidayPrefById(state, holidayId));
const items =
  holidayData?.tasks?.filter(task => task.category === 'CategoryName') || [];
```

### **2. CRUD Operations Pattern**

**Found in:** 40+ pages with add/edit/delete functionality  
**Duplication:**

```tsx
// Repeated CRUD state management (80-120 lines each)
const [showForm, setShowForm] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [editingItem, setEditingItem] = useState(null);
const [deleteLoading, setDeleteLoading] = useState(false);

async function handleAdd(values: Record<string, any>) {
  const payload = transformPayload(values, contacts);
  const response = await fetch(`/api/holidays/${holidayId}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-test-user': JSON.stringify({
        sub: auth0User.sub,
        email: auth0User.email,
        name: auth0User.name,
        picture: auth0User.picture,
      }),
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  updateItemInRedux(result, 'add');
  await refreshHomeData();
}
```

### **3. Gift List Page Pattern**

**Found in:** 15+ identical gift list pages  
**Duplication:** Each page is 400+ lines of nearly identical code

```tsx
// Repeated updateGiftInRedux function (50+ lines each)
const updateGiftInRedux = (
  giftData: any,
  operation: 'add' | 'update' | 'delete',
) => {
  if (!holidayId) return;

  let processedGiftData = giftData;
  if (operation === 'add' || operation === 'update') {
    // Process gift data logic...
  }

  if (operation === 'add') {
    dispatch(addGiftToHomeData({ holidayId, gift: processedGiftData }));
  } else if (operation === 'update') {
    dispatch(updateGiftInHomeData({ holidayId, gift: processedGiftData }));
  } else if (operation === 'delete') {
    dispatch(removeGiftFromHomeData({ holidayId, giftId: giftData.id }));
  }
};
```

### **4. FormModal Configuration Pattern**

**Found in:** 50+ files using FormModal  
**Duplication:**

```tsx
// Repeated form setup (20-30 lines each)
<FormModal
  isOpen={showForm}
  title="Add New Item"
  fields={formFields}
  onSubmit={handleSubmit}
  onClose={() => setShowForm(false)}
  loading={isLoading}
  submitText="Add Item"
  cancelText="Cancel"
  cardClassName="card card-items"
  submitButtonColor="#color"
  showAddressBook={true}
  contacts={contacts}
/>
```

### **5. SortModal Pattern**

**Found in:** 30+ task management pages  
**Duplication:**

```tsx
// Repeated sort modal setup (15-20 lines each)
<SortModal
  isOpen={showSortModal}
  onClose={() => setShowSortModal(false)}
  sortBy={sortBy}
  onSortChange={(sortOption: string) => setSortBy(sortOption as SortOption)}
  sortOptions={[
    { value: 'none', label: 'None' },
    { value: 'priority', label: 'Priority' },
    { value: 'dateDue', label: 'Date Due' },
    { value: 'assignedTo', label: 'Assigned To' },
    { value: 'category', label: 'Category' },
  ]}
  title="Sort Tasks"
/>
```

### **6. API Request Headers Pattern**

**Found in:** 100+ API calls  
**Duplication:**

```tsx
// Repeated auth headers (8-10 lines each)
headers: {
  'Content-Type': 'application/json',
  'x-test-user': JSON.stringify({
    sub: auth0User.sub,
    email: auth0User.email,
    name: auth0User.name,
    picture: auth0User.picture,
  }),
}
```

### **7. Card Pages Pattern**

**Found in:** 12 holiday card pages  
**Duplication:** 99% identical code with only styling differences (300+ lines each)

---

## **REFACTORING OPPORTUNITIES**

### **HIGH IMPACT REFACTORS** 🔥

#### **1. Holiday Page Base Component**

- **Type:** Component
- **Files involved:** 70+ holiday pages
- **Problem:** 150-200 lines of setup code repeated in every page
- **Solution:**

```tsx
// src/components/pages/HolidayPageBase.tsx
interface HolidayPageBaseProps {
  holidayName: string;
  category?: 'tasks' | 'decorations' | 'events' | 'gifts' | 'cards';
  children: (props: HolidayPageData) => React.ReactNode;
}

export function HolidayPageBase({
  holidayName,
  category,
  children,
}: HolidayPageBaseProps) {
  // All repeated Redux setup
  // All repeated data fetching
  // All repeated state management
  return (
    <div
      className={`min-h-screen ${getHolidayGradient(holidayName)} flex flex-col items-center p-4 sm:p-8`}
    >
      <HolidayPageHeader
        holidayName={holidayName}
        backHref={`/${holidayName.toLowerCase()}`}
      />
      {children({
        holidayData,
        items,
        isLoading,
        isHolidayShared,
        contacts,
        holidayId,
      })}
    </div>
  );
}
```

- **Expected benefit:** **10,000+ LOC reduction** (150 lines × 70 pages)
- **Maintenance improvement:** Adding new holiday pages becomes trivial

#### **2. Unified CRUD Operations Hook**

- **Type:** Custom Hook
- **Files involved:** 40+ pages with CRUD operations
- **Problem:** 100+ lines of identical CRUD logic per page
- **Solution:**

```tsx
// src/hooks/useHolidayCRUD.ts
export function useHolidayCRUD<T>(
  holidayId: string,
  itemType: 'tasks' | 'gifts' | 'cards' | 'guests',
  transformer: (values: any, contacts: any[]) => any,
) {
  // Unified state management
  // Unified API operations
  // Unified Redux updates
  // Unified error handling
  return {
    showForm,
    setShowForm,
    showEditModal,
    setShowEditModal,
    editingItem,
    setEditingItem,
    handleAdd,
    handleEdit,
    handleDelete,
    isLoading,
    error,
  };
}
```

- **Expected benefit:** **4,000+ LOC reduction** (100 lines × 40 pages)
- **Type safety:** Full TypeScript generics support

#### **3. Gift List Page Template**

- **Type:** Component Template
- **Files involved:** 15+ gift list pages
- **Problem:** 400+ identical lines per page
- **Solution:**

```tsx
// src/components/pages/GiftListPageTemplate.tsx
interface GiftListPageProps {
  holidayName: string;
  holidayTheme: HolidayTheme;
}

export function GiftListPageTemplate({
  holidayName,
  holidayTheme,
}: GiftListPageProps) {
  // All shared gift list logic
  // Theme-aware styling
  // Unified CRUD operations
}

// Usage becomes:
export default function ChristmasGiftListPage() {
  return (
    <GiftListPageTemplate holidayName="Christmas" holidayTheme={themes.christmas} />
  );
}
```

- **Expected benefit:** **5,600+ LOC reduction** (400 lines × 15 pages)
- **Consistency:** All gift pages behave identically

### **MEDIUM IMPACT REFACTORS** 📊

#### **4. Task Management Hook**

- **Type:** Custom Hook
- **Files involved:** 30+ task/event/decoration pages
- **Problem:** 80+ lines of sort, filter, and task operations per page
- **Solution:**

```tsx
// src/hooks/useTaskManagement.ts
export function useTaskManagement(holidayId: string, category?: string) {
  // Unified sorting logic
  // Unified filtering logic
  // Unified task operations
  return {
    tasks: sortedFilteredTasks,
    sortModal: { isOpen, onClose, sortBy, onSortChange, sortOptions },
    addTask,
    editTask,
    deleteTask,
    toggleComplete,
  };
}
```

- **Expected benefit:** **2,400+ LOC reduction** (80 lines × 30 pages)

#### **5. Holiday Data Access Hook**

- **Type:** Custom Hook
- **Files involved:** 70+ pages accessing Redux data
- **Problem:** 30-40 lines of repeated selectors and data access
- **Solution:**

```tsx
// src/hooks/useHolidayData.ts
export function useHolidayData(holidayName: string, category?: string) {
  // Memoized selectors
  // Unified data access patterns
  // Automatic refresh logic
  return {
    holidayData,
    items,
    isLoading,
    isHolidayShared,
    refreshData,
    updateItem,
  };
}
```

- **Expected benefit:** **2,100+ LOC reduction** (30 lines × 70 pages)

#### **6. Card Page Template**

- **Type:** Component Template
- **Files involved:** 12 holiday card pages
- **Problem:** 300+ nearly identical lines per page
- **Expected benefit:** **3,200+ LOC reduction** (300 lines × 12 pages)

### **LOW IMPACT REFACTORS** 📈

#### **7. API Utilities**

- **Type:** Utility Functions
- **Files involved:** 100+ API calls
- **Solution:**

```tsx
// src/utils/apiHelpers.ts
export function createAuthHeaders(auth0User: any) {
  /* ... */
}
export function makeHolidayRequest(endpoint: string, options: RequestOptions) {
  /* ... */
}
```

- **Expected benefit:** **800+ LOC reduction** (8 lines × 100 calls)

#### **8. Holiday Theme System**

- **Type:** Configuration System
- **Files involved:** 70+ pages with holiday-specific styling
- **Solution:**

```tsx
// src/config/holidayThemes.ts
export const holidayThemes = {
  christmas: {
    gradient: 'christmas-gradient',
    accent: '#dc2626',
    card: 'card-christmas',
  },
  hanukkah: {
    gradient: 'hanukkah-gradient',
    accent: '#2563eb',
    card: 'card-hanukkah',
  },
  // ... all holidays
};
```

- **Expected benefit:** Centralized theme management, easier maintenance

#### **9. Form Configuration System**

- **Type:** Enhanced Configuration
- **Files involved:** 50+ FormModal usages
- **Solution:**

```tsx
// src/hooks/useFormModal.ts
export function useFormModal(type: FormType, holidayTheme: HolidayTheme) {
  // Theme-aware form configuration
  // Simplified setup
  return { formModal: <FormModal {...configuredProps} />, showForm, handleSubmit };
}
```

- **Expected benefit:** **1,000+ LOC reduction** (20 lines × 50 usages)

---

## **IMPLEMENTATION ROADMAP**

### **Phase 1: Foundation (Weeks 1-2)**

**Target: ~15,000 LOC reduction**

1. **Create Holiday Theme System**
   - Extract all holiday-specific styling constants
   - Create theme utility functions
   - Update 10-15 pages to test the system

2. **Build HolidayPageBase Component**
   - Start with 3-5 simple holiday pages
   - Migrate Redux setup logic
   - Test with different page types

3. **Create API Utilities**
   - Extract auth header creation
   - Create unified request functions
   - Update 20-30 API calls initially

### **Phase 2: Core Templates (Weeks 3-4)**

**Target: ~10,000 LOC reduction**

4. **Implement useHolidayCRUD Hook**
   - Start with gift list operations
   - Extend to task operations
   - Migrate 15-20 pages

5. **Build Gift List Page Template**
   - Create the template component
   - Migrate all 15 gift list pages
   - Test functionality across holidays

6. **Create useTaskManagement Hook**
   - Extract sorting and filtering logic
   - Unify task operations
   - Migrate task/decoration/event pages

### **Phase 3: Refinement (Week 5)**

**Target: ~4,400 LOC reduction**

7. **Complete Holiday Data Hook**
   - Finish useHolidayData implementation
   - Migrate remaining pages to use it
   - Optimize selector performance

8. **Card Page Template**
   - Create unified card page template
   - Migrate all 12 card pages
   - Ensure consistent behavior

9. **Form Modal Enhancements**
   - Implement useFormModal hook
   - Theme-aware form configurations
   - Migrate remaining form usages

### **Phase 4: Polish & Optimization**

**Target: Performance and maintainability**

10. **SVG Icon Decomposition**
    - Split holidayShapes.tsx into individual files
    - Implement lazy loading for icons
    - Optimize bundle size

11. **AlertsBell Component Refactor**
    - Break down into smaller components
    - Extract invitation logic to hooks
    - Improve performance

12. **Testing & Documentation**
    - Add tests for new hooks and components
    - Document new patterns
    - Create migration guide

---

## **EXPECTED OUTCOMES**

### **Quantitative Benefits**

- **Total LOC Reduction:** ~29,400+ lines (53% of codebase)
- **File Count Reduction:** Consolidate 70+ similar pages into templates
- **Bundle Size:** Potential 20-30% reduction through better tree-shaking
- **Development Speed:** New holiday pages from 400+ lines to ~50 lines

### **Qualitative Benefits**

- **Consistency:** All holiday pages behave identically
- **Maintainability:** Bug fixes apply to all pages automatically
- **Type Safety:** Better TypeScript support with generics
- **Developer Experience:** Simpler onboarding, clearer patterns
- **Performance:** Reduced re-renders, better memoization
- **Testing:** Easier to test consolidated logic

### **Risk Mitigation**

- **Incremental Migration:** Can be done page by page
- **Backward Compatibility:** Old pages work during transition
- **Type Safety:** TypeScript catches breaking changes
- **Testing:** Maintain test coverage throughout migration
- **Rollback Plan:** Git history allows easy rollbacks

---

## **SUCCESS METRICS**

### **Development Metrics**

- [ ] Lines of code reduced by >25,000
- [ ] New holiday page creation time < 30 minutes
- [ ] Bundle size reduced by >20%
- [ ] TypeScript compilation time improved

### **Code Quality Metrics**

- [ ] Cyclomatic complexity reduced
- [ ] Code duplication index < 5%
- [ ] Test coverage maintained >80%
- [ ] ESLint warnings reduced >90%

### **Developer Experience Metrics**

- [ ] Onboarding time for new developers reduced
- [ ] Feature development velocity increased
- [ ] Bug fix propagation time decreased
- [ ] Code review time reduced

---

## **NOTES & CONSIDERATIONS**

### **Technical Debt Areas**

1. **AlertsBell Component:** Needs significant refactoring due to size
2. **holidayShapes.tsx:** Should be split into individual icon files
3. **Settings Page:** Could benefit from modularization
4. **Prop Drilling:** Some components have deep prop drilling that could be improved

### **Architecture Improvements**

1. **State Management:** Consider Zustand for lighter state management
2. **Data Fetching:** Evaluate React Query for better cache management
3. **Code Splitting:** Implement route-based code splitting
4. **Performance:** Add React.memo and useMemo strategically

### **Future Enhancements**

1. **Micro-frontends:** Holiday pages could become separate micro-apps
2. **Plugin System:** Allow holiday-specific features as plugins
3. **Dynamic Theming:** Runtime theme switching capability
4. **Internationalization:** Prepare for multiple languages

This analysis provides a comprehensive roadmap for significantly improving code reusability and reducing duplication across the Next Holiday application.
