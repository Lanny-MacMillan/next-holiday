# Form Builder System Migration Guide

## Overview

The new Form Builder System (Phase 3) consolidates the 3 different form field patterns found across the application into a unified, scalable system. This system provides:

- **Unified Form Configurations**: Consistent form structure across all holidays
- **Dynamic AssignTo Fields**: Automatically populated with share members
- **Holiday-Specific Theming**: Custom styling per holiday
- **Backward Compatibility**: Existing `getFormConfig` usage continues to work

## Architecture

### Core Components

1. **`src/config/baseFormConfigs.ts`**: Base form configurations for task, gift, and card content types
2. **`src/lib/formBuilder.ts`**: Dynamic form builder with share member integration
3. **`src/types/form.ts`**: Shared TypeScript interfaces
4. **Enhanced FormModal**: Support for dynamic assignTo field population

### Key Features

- **AssignTo Field**: Automatically shown only when holiday is shared (shareMembers.length > 1)
- **Holiday Theming**: Pre-configured gradients and styling for different holidays
- **Type Safety**: Full TypeScript support with proper interfaces
- **Extensible**: Easy to add new content types or holiday customizations

## Usage

### New Form Builder System (Recommended)

```typescript
import { buildFormConfig, ShareMember } from '@/lib/formBuilder';
import { HolidayKey } from '@/config/baseFormConfigs';
import FormModal from '@/components/modals/FormModal';

// In your component
const shareMembers: ShareMember[] = [
  { userId: 'user1', email: 'user@example.com', name: 'John', role: 'owner' },
  { userId: 'user2', email: 'jane@example.com', name: 'Jane', role: 'collaborator' }
];

const giftFormConfig = useMemo(
  () => buildFormConfig('gift', 'christmas', shareMembers, {
    submitText: 'Add Christmas Gift',
    submitButtonColor: '#dc2626', // Custom red
  }),
  [shareMembers]
);

return (
  <FormModal
    isOpen={isOpen}
    title="Add Gift"
    fields={giftFormConfig.fields}
    onSubmit={onSubmit}
    onClose={onClose}
    submitText={giftFormConfig.submitText}
    cardClassName={giftFormConfig.cardClassName}
    showAddressBook={giftFormConfig.showAddressBook}
    shareMembers={shareMembers} // Important: Pass shareMembers for assignTo field
  />
);
```

### Enhanced Legacy System (Backward Compatible)

```typescript
import { getFormConfigEnhanced } from '@/config/formConfigs';

const formConfig = getFormConfigEnhanced('gifts', 'add', {
  holidayKey: 'christmas',
  shareMembers: shareMembers,
  customSubmitText: 'Add Gift',
});

// Use formConfig with existing FormModal usage pattern
```

### Legacy System (Still Works)

```typescript
import { getFormConfig } from '@/config/formConfigs';

// This continues to work as before, but won't have assignTo field
const formConfig = getFormConfig('gifts', 'add');
```

## Content Types

### Supported Content Types

| Content Type | Description            | AssignTo Support | Address Book |
| ------------ | ---------------------- | ---------------- | ------------ |
| `task`       | Todo items, checklists | ✅ Yes           | ❌ No        |
| `gift`       | Gift planning          | ✅ Yes           | ✅ Yes       |
| `card`       | Greeting cards         | ✅ Yes           | ✅ Yes       |

### Holiday Keys

Supported holiday keys with custom theming:

- `christmas` - Red/green gradient
- `hanukkah` - Blue/indigo gradient
- `halloween` - Orange/purple gradient
- `valentines` - Pink/rose gradient
- `easter` - Yellow/green gradient
- `fourth-of-july` - Red/blue gradient

## Migration Steps

### For New Holiday Pages (Recommended)

1. Import the new form builder:

```typescript
import { buildFormConfig } from '@/lib/formBuilder';
import { HolidayKey } from '@/config/baseFormConfigs';
```

2. Use `buildFormConfig` instead of `getFormConfig`:

```typescript
const formConfig = buildFormConfig('gift', 'christmas', shareMembers);
```

3. Pass `shareMembers` to FormModal:

```typescript
<FormModal
  {...otherProps}
  shareMembers={shareMembers}
/>
```

### For Existing Holiday Pages (Gradual Migration)

1. **Option A: Minimal Change** - Use enhanced legacy system:

```typescript
import { getFormConfigEnhanced } from '@/config/formConfigs';

const formConfig = getFormConfigEnhanced('gifts', 'add', {
  holidayKey: 'christmas',
  shareMembers: shareMembers,
});
```

2. **Option B: Full Migration** - Switch to new system gradually:
   - Update imports
   - Replace `getFormConfig` with `buildFormConfig`
   - Add `shareMembers` prop to FormModal

### Pattern Consolidation

The new system replaces these 3 patterns found across holiday pages:

**❌ Old Pattern A (Conditional Spread):**

```typescript
...(isHolidayShared
  ? [{ id: 'assignedTo', type: 'text', placeholder: 'Assigned To' }]
  : [])
```

**❌ Old Pattern B (Config Filtering):**

```typescript
fields={getFormConfig('tasks', 'add').fields.filter(
  field => field.id !== 'assignedTo' || (isAuthorized && isShared)
)}
```

**❌ Old Pattern C (Hardcoded):**

```typescript
{ id: 'assignedTo', type: 'text', placeholder: 'Assigned To' }
```

**✅ New Unified Pattern:**

```typescript
const formConfig = buildFormConfig('task', holidayKey, shareMembers);
// AssignTo field automatically included/excluded based on shareMembers
```

## Benefits

### For Developers

- **Reduced Duplication**: Single source of truth for form configurations
- **Type Safety**: Full TypeScript support prevents runtime errors
- **Consistency**: Same patterns across all holiday implementations
- **Maintainability**: Changes propagate automatically across all forms

### For Users

- **Consistent UX**: Same form behavior across all holidays
- **Smart Defaults**: AssignTo field only shows when meaningful
- **Holiday Theming**: Visual consistency with holiday-specific styling
- **Better Assignment**: Clear dropdown with member names vs raw text input

## Troubleshooting

### AssignTo Field Not Showing

**Cause**: shareMembers array is empty or has only 1 member (the owner)
**Solution**: Ensure holiday is shared with other users:

```typescript
const shareMembers = [
  { userId: 'owner', email: 'owner@example.com', name: 'Owner', role: 'owner' },
  {
    userId: 'collaborator',
    email: 'collab@example.com',
    name: 'Collaborator',
    role: 'collaborator',
  },
];
```

### TypeScript Errors

**Cause**: Missing FormField interface import
**Solution**: Import from types instead of FormModal:

```typescript
// ❌ Old
import { FormField } from '@/components/modals/FormModal';

// ✅ New
import { FormField } from '@/types/form';
```

### Styling Issues

**Cause**: Holiday key not recognized or missing customizations
**Solution**: Check `HOLIDAY_CUSTOMIZATIONS` in baseFormConfigs.ts and add your holiday:

```typescript
export const HOLIDAY_CUSTOMIZATIONS = {
  'my-holiday': {
    task: {
      cardClassName:
        'bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-lg',
    },
  },
} as const;
```

## Future Enhancements

- **Email Notifications**: Integration with notification system for assignments
- **Custom Validators**: Per-field validation rules
- **Conditional Fields**: Show/hide fields based on other field values
- **Field Dependencies**: Auto-populate related fields
- **Form Analytics**: Track form completion rates and field usage
