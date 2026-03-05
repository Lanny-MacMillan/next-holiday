# FormModal Component

A reusable form modal component that can be configured for different holiday pages and form types.

## Features

- **Configurable Fields**: Support for text, textarea, select, number, date, url, and checkbox inputs
- **Address Book Integration**: Built-in address book functionality for recipient fields
- **Customizable Styling**: Configurable colors, card classes, and button text
- **Form Validation**: Built-in required field validation
- **Loading States**: Support for loading states during form submission
- **Edit Mode**: Support for editing existing items with pre-filled values

## Usage

### Basic Usage

```tsx
import FormModal from '@/components/modals/FormModal';
import { getFormConfig } from '@/config/formConfigs';

// In your component
const [showForm, setShowForm] = useState(false);

const handleSubmit = (formValues: Record<string, any>) => {
  // Handle form submission
  console.log(formValues);
  setShowForm(false);
};

<FormModal
  isOpen={showForm}
  title="Add New Item"
  fields={getFormConfig('cards', 'add').fields}
  onSubmit={handleSubmit}
  onClose={() => setShowForm(false)}
  loading={loading}
  submitText="Add Item"
  cancelText="Cancel"
  cardClassName="card card-cards"
  submitButtonColor="#ef4444"
/>;
```

### With Address Book Integration

```tsx
<FormModal
  isOpen={showForm}
  title="Add New Card"
  fields={getFormConfig('cards', 'add').fields}
  onSubmit={handleSubmit}
  onClose={() => setShowForm(false)}
  loading={loading}
  showAddressBook={true}
  contacts={contacts}
  onAddressBookSelect={contact => {
    // Optional callback when address book contact is selected
  }}
/>
```

### Edit Mode

```tsx
<FormModal
  isOpen={showForm}
  title="Edit Card"
  fields={getFormConfig('cards', 'edit').fields}
  initialValues={{
    recipient: editingCard.recipient,
    address: editingCard.address || '',
    message: editingCard.message,
  }}
  onSubmit={handleSubmit}
  onClose={() => setShowForm(false)}
  loading={loading}
  submitText="Update Card"
/>
```

## Form Configurations

The component uses predefined form configurations from `src/config/formConfigs.ts`:

### Available Configurations

- **Cards**: `getFormConfig("cards", "add" | "edit")`
  - Fields: recipient, address, message
  - Address book integration enabled
  - Red submit button

- **Tasks**: `getFormConfig("tasks", "add" | "edit")`
  - Fields: title, description, priority, assignedTo, category, dueDate
  - Green submit button

- **Gifts**: `getFormConfig("gifts", "add" | "edit")`
  - Fields: name, recipient, description, price, store, productLink, notes
  - Address book integration enabled
  - Yellow submit button

## Props

| Prop                  | Type                | Required | Description                        |
| --------------------- | ------------------- | -------- | ---------------------------------- |
| `isOpen`              | boolean             | Yes      | Controls modal visibility          |
| `title`               | string              | Yes      | Modal title                        |
| `fields`              | FormField[]         | Yes      | Array of form field configurations |
| `onSubmit`            | function            | Yes      | Callback when form is submitted    |
| `onClose`             | function            | Yes      | Callback when modal is closed      |
| `initialValues`       | Record<string, any> | No       | Pre-filled form values             |
| `loading`             | boolean             | No       | Shows loading state                |
| `submitText`          | string              | No       | Submit button text                 |
| `cancelText`          | string              | No       | Cancel button text                 |
| `cardClassName`       | string              | No       | CSS class for modal card           |
| `submitButtonColor`   | string              | No       | Submit button color                |
| `showAddressBook`     | boolean             | No       | Enable address book integration    |
| `contacts`            | any[]               | No       | Address book contacts              |
| `onAddressBookSelect` | function            | No       | Callback when contact is selected  |

## FormField Interface

```tsx
interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'url' | 'checkbox';
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
  step?: string;
  className?: string;
  style?: React.CSSProperties;
}
```

## Field Types

- **text**: Standard text input
- **textarea**: Multi-line text input
- **select**: Dropdown with options
- **number**: Numeric input with optional step
- **date**: Date picker
- **url**: URL input with validation
- **checkbox**: Boolean checkbox with label

## Examples

### Creating a Custom Form Configuration

```tsx
const customFormConfig = {
  title: 'Custom Form',
  fields: [
    {
      id: 'name',
      type: 'text',
      placeholder: 'Name*',
      required: true,
    },
    {
      id: 'description',
      type: 'textarea',
      placeholder: 'Description',
      rows: 3,
    },
    {
      id: 'priority',
      type: 'select',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
    },
  ],
  submitText: 'Save',
  cancelText: 'Cancel',
  cardClassName: 'card custom-card',
  submitButtonColor: '#3b82f6',
};
```

### Using the FormModal with Custom Configuration

```tsx
<FormModal
  isOpen={showForm}
  title={customFormConfig.title}
  fields={customFormConfig.fields}
  onSubmit={handleSubmit}
  onClose={() => setShowForm(false)}
  submitText={customFormConfig.submitText}
  cancelText={customFormConfig.cancelText}
  cardClassName={customFormConfig.cardClassName}
  submitButtonColor={customFormConfig.submitButtonColor}
/>
```
