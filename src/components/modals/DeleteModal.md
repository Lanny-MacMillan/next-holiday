# DeleteModal Component

A reusable delete confirmation modal component that can be used across all holiday pages for consistent delete confirmations.

## Features

- **Consistent Styling**: Same modal structure across all pages
- **Configurable Content**: Customizable title, message, and button text
- **Item Name Support**: Can display the specific item name being deleted
- **Loading States**: Support for loading states during deletion
- **Customizable Colors**: Configurable button colors and card styling
- **Type Safety**: Full TypeScript support with proper interfaces

## Usage

### Basic Usage

```tsx
import DeleteModal from '@/components/modals/DeleteModal';

// In your component
const [showDeleteModal, setShowDeleteModal] = useState(false);

const handleConfirmDelete = () => {
  // Handle deletion
  console.log('Item deleted');
  setShowDeleteModal(false);
};

const handleCancelDelete = () => {
  setShowDeleteModal(false);
};

<DeleteModal
  isOpen={showDeleteModal}
  title="Confirm Delete"
  message="Are you sure you want to delete this item? This action cannot be undone."
  onConfirm={handleConfirmDelete}
  onCancel={handleCancelDelete}
  loading={loading}
/>;
```

### With Item Name

```tsx
<DeleteModal
  isOpen={showDeleteModal}
  title="Delete Task?"
  itemName={task.title}
  onConfirm={handleConfirmDelete}
  onCancel={handleCancelDelete}
  loading={loading}
/>
```

### Using Configuration

```tsx
import { getDeleteConfig } from '@/config/deleteModalConfigs';

<DeleteModal
  isOpen={showDeleteModal}
  {...getDeleteConfig('cards')}
  onConfirm={handleConfirmDelete}
  onCancel={handleCancelDelete}
  loading={loading}
/>;
```

## Props

| Prop                 | Type     | Required | Description                                    |
| -------------------- | -------- | -------- | ---------------------------------------------- |
| `isOpen`             | boolean  | Yes      | Controls modal visibility                      |
| `title`              | string   | No       | Modal title (default: "Confirm Delete")        |
| `message`            | string   | No       | Custom message text                            |
| `itemName`           | string   | No       | Name of item being deleted (overrides message) |
| `onConfirm`          | function | Yes      | Callback when delete is confirmed              |
| `onCancel`           | function | Yes      | Callback when delete is cancelled              |
| `loading`            | boolean  | No       | Shows loading state                            |
| `cardClassName`      | string   | No       | CSS class for modal card                       |
| `confirmText`        | string   | No       | Confirm button text (default: "Delete")        |
| `cancelText`         | string   | No       | Cancel button text (default: "Cancel")         |
| `confirmButtonColor` | string   | No       | Confirm button color (default: "#ef4444")      |

## Delete Configurations

The component uses predefined delete configurations from `src/config/deleteModalConfigs.ts`:

### Available Configurations

- **Cards**: `getDeleteConfig("cards")`
  - Title: "Confirm Delete"
  - Message: "Are you sure you want to delete this card? This action cannot be undone."
  - Card class: "card card-cards"
  - Red confirm button

- **Tasks**: `getDeleteConfig("tasks")`
  - Title: "Delete Task?"
  - Message: "Are you sure you want to delete this task? This action cannot be undone."
  - Card class: "bg-white dark:bg-gray-800"
  - Red confirm button

- **Gifts**: `getDeleteConfig("gifts")`
  - Title: "Confirm Delete"
  - Message: "Are you sure you want to delete this gift? This action cannot be undone."
  - Card class: "card card-gifts"
  - Red confirm button

## Examples

### Page-Level Delete Modal

```tsx
// In a page component
const [deleteConfirm, setDeleteConfirm] = useState({
  show: false,
  itemId: null,
});

const handleDelete = (itemId: string) => {
  setDeleteConfirm({ show: true, itemId });
};

const confirmDelete = () => {
  if (deleteConfirm.itemId) {
    dispatch(deleteItem(deleteConfirm.itemId));
    setDeleteConfirm({ show: false, itemId: null });
  }
};

const cancelDelete = () => {
  setDeleteConfirm({ show: false, itemId: null });
};

<DeleteModal
  isOpen={deleteConfirm.show}
  {...getDeleteConfig('cards')}
  onConfirm={confirmDelete}
  onCancel={cancelDelete}
  loading={loading}
/>;
```

### Component-Level Delete Modal

```tsx
// In a card component
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

const handleDelete = (e: React.MouseEvent) => {
  e.stopPropagation();
  setShowDeleteConfirm(true);
};

const confirmDelete = () => {
  onDelete(item.id);
  setShowDeleteConfirm(false);
};

const cancelDelete = () => {
  setShowDeleteConfirm(false);
};

<DeleteModal
  isOpen={showDeleteConfirm}
  {...getDeleteConfig('tasks')}
  itemName={item.title}
  onConfirm={confirmDelete}
  onCancel={cancelDelete}
/>;
```

### Custom Configuration

```tsx
const customDeleteConfig = {
  title: 'Remove Item',
  message: 'This action will permanently remove the item from your list.',
  cardClassName: 'card custom-card',
  confirmText: 'Remove',
  cancelText: 'Keep',
  confirmButtonColor: '#dc2626',
};

<DeleteModal
  isOpen={showDeleteModal}
  {...customDeleteConfig}
  onConfirm={handleConfirmDelete}
  onCancel={handleCancelDelete}
/>;
```

## Integration with Existing Pages

The DeleteModal component has been integrated into:

1. **Cards page** (`/christmas/cards`) - Page-level delete modal
2. **Tasks page** (`/christmas/tasks`) - Component-level delete modal in ToDoCard
3. **Gift-list page** (`/christmas/gift-list`) - Page-level delete modal

All existing functionality is preserved while providing a consistent, reusable interface.
