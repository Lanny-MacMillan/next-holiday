import { FormField, FormConfig } from '../types/form';

export const ASSIGNTO_FIELD: FormField = {
  id: 'assigned_to', // Changed from 'assignedTo' to match API
  type: 'select',
  placeholder: 'Assign to (optional)',
  options: [], // Populated dynamically with share members
};

export const BASE_FORM_CONFIGS = {
  task: {
    fields: [
      { id: 'title', type: 'text', placeholder: 'Task Title*', required: true },
      { id: 'description', type: 'textarea', placeholder: 'Description', rows: 2 },
      {
        id: 'priority',
        type: 'select',
        placeholder: 'Priority',
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ],
      },
      ASSIGNTO_FIELD,
      { id: 'dueDate', type: 'date', placeholder: 'Due Date' },
    ],
    submitText: 'Add Task',
    cardClassName: 'bg-white dark:bg-gray-800 rounded-lg shadow-lg',
  },
  gift: {
    fields: [
      {
        id: 'recipient',
        type: 'text',
        placeholder: 'Recipient',
        showAddressBook: true, // Only recipient field should have address book
      },
      { id: 'name', type: 'text', placeholder: 'Gift Name*', required: true },
      { id: 'description', type: 'textarea', placeholder: 'Description', rows: 2 },
      { id: 'price', type: 'number', placeholder: 'Price', step: '0.01' },
      { id: 'store', type: 'text', placeholder: 'Store' },
      { id: 'product_link', type: 'url', placeholder: 'Product Link (optional)' },
      ASSIGNTO_FIELD, // NEW
      { id: 'notes', type: 'textarea', placeholder: 'Notes', rows: 2 },
    ],
    submitText: 'Add Gift',
    cardClassName: 'card',
  },
  card: {
    fields: [
      {
        id: 'recipient',
        type: 'text',
        placeholder: 'Recipient*',
        required: true,
        showAddressBook: true, // Only recipient field should have address book
      },
      { id: 'address', type: 'text', placeholder: 'Address (optional)' },
      {
        id: 'message',
        type: 'textarea',
        placeholder: 'Message*',
        required: true,
        rows: 3,
      },
      ASSIGNTO_FIELD, // NEW
    ],
    submitText: 'Add Card',
    cardClassName: 'card card-cards',
  },
  event: {
    fields: [
      { id: 'title', type: 'text', placeholder: 'Event Title*', required: true },
      { id: 'description', type: 'textarea', placeholder: 'Description', rows: 2 },
      { id: 'venue', type: 'text', placeholder: 'Venue' },
      { id: 'dateTime', type: 'datetime-local', placeholder: 'Date & Time' },
      ASSIGNTO_FIELD,
    ],
    submitText: 'Add Event',
    cardClassName: 'card card-events',
  },
  decoration: {
    fields: [
      { id: 'item', type: 'text', placeholder: 'Decoration Item*', required: true },
      { id: 'description', type: 'textarea', placeholder: 'Description', rows: 2 },
      { id: 'location', type: 'text', placeholder: 'Location' },
      { id: 'quantity', type: 'number', placeholder: 'Quantity' },
      ASSIGNTO_FIELD,
    ],
    submitText: 'Add Decoration',
    cardClassName: 'card card-decorations',
  },
  supply: {
    fields: [
      { id: 'item', type: 'text', placeholder: 'Supply Item*', required: true },
      { id: 'description', type: 'textarea', placeholder: 'Description', rows: 2 },
      { id: 'quantity', type: 'number', placeholder: 'Quantity' },
      { id: 'store', type: 'text', placeholder: 'Store' },
      ASSIGNTO_FIELD,
    ],
    submitText: 'Add Supply',
    cardClassName: 'card card-supplies',
  },
  resolution: {
    fields: [
      { id: 'title', type: 'text', placeholder: 'Resolution*', required: true },
      { id: 'description', type: 'textarea', placeholder: 'Description', rows: 2 },
      {
        id: 'category',
        type: 'select',
        placeholder: 'Category',
        options: [
          { value: 'health', label: 'Health & Fitness' },
          { value: 'personal', label: 'Personal Growth' },
          { value: 'career', label: 'Career' },
          { value: 'relationships', label: 'Relationships' },
          { value: 'hobbies', label: 'Hobbies' },
          { value: 'other', label: 'Other' },
        ],
      },
      { id: 'targetDate', type: 'date', placeholder: 'Target Date' },
    ],
    submitText: 'Add Resolution',
    cardClassName: 'card card-resolutions',
  },
  'guest-list': {
    fields: [
      {
        id: 'name',
        type: 'text',
        placeholder: 'Guest Name*',
        required: true,
        showAddressBook: true,
      },
      { id: 'email', type: 'email', placeholder: 'Email' },
      { id: 'phone', type: 'tel', placeholder: 'Phone' },
      { id: 'address', type: 'text', placeholder: 'Address' },
      { id: 'notes', type: 'textarea', placeholder: 'Notes', rows: 3 },
    ],
    submitText: 'Add Guest',
    cardClassName: 'card',
  },
  shopping: {
    fields: [
      {
        id: 'recipient',
        type: 'text',
        placeholder: 'Recipient',
        showAddressBook: true, // Only recipient field should have address book
      },
      { id: 'name', type: 'text', placeholder: 'Item Name*', required: true },
      { id: 'description', type: 'textarea', placeholder: 'Description', rows: 2 },
      { id: 'price', type: 'number', placeholder: 'Price', step: '0.01' },
      { id: 'store', type: 'text', placeholder: 'Store' },
      { id: 'product_link', type: 'url', placeholder: 'Product Link (optional)' },
      ASSIGNTO_FIELD, // NEW
      { id: 'notes', type: 'textarea', placeholder: 'Notes', rows: 2 },
    ],
    submitText: 'Add Item',
    cardClassName: 'card',
  },
} as const;

// Holiday-specific customizations
export const HOLIDAY_CUSTOMIZATIONS = {
  christmas: {
    task: {
      cardClassName:
        'bg-gradient-to-br from-red-50 to-green-50 dark:from-red-900/20 dark:to-green-900/20 rounded-lg shadow-lg',
    },
    gift: {
      cardClassName:
        'card bg-gradient-to-br from-red-50 to-green-50 dark:from-red-900/20 dark:to-green-900/20',
    },
    card: {
      cardClassName:
        'card card-cards bg-gradient-to-br from-red-50 to-green-50 dark:from-red-900/20 dark:to-green-900/20',
    },
  },
  hanukkah: {
    task: {
      cardClassName:
        'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-lg',
    },
    gift: {
      cardClassName:
        'card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    },
    card: {
      cardClassName:
        'card card-cards bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    },
  },
  halloween: {
    task: {
      cardClassName:
        'bg-gradient-to-br from-orange-50 to-purple-50 dark:from-orange-900/20 dark:to-purple-900/20 rounded-lg shadow-lg',
    },
    gift: {
      cardClassName:
        'card bg-gradient-to-br from-orange-50 to-purple-50 dark:from-orange-900/20 dark:to-purple-900/20',
    },
    card: {
      cardClassName:
        'card card-cards bg-gradient-to-br from-orange-50 to-purple-50 dark:from-orange-900/20 dark:to-purple-900/20',
    },
  },
  thanksgiving: {
    task: {
      cardClassName:
        'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg shadow-lg',
    },
    gift: {
      cardClassName:
        'card bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
    },
    card: {
      cardClassName:
        'card card-cards bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
    },
    event: {
      cardClassName:
        'card card-events bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
    },
    decoration: {
      cardClassName:
        'card card-decorations bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
    },
    'guest-list': {
      cardClassName:
        'card bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
    },
    shopping: {
      cardClassName:
        'card bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
    },
    supply: {
      cardClassName:
        'card card-supplies bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
    },
  },
  valentines: {
    task: {
      cardClassName:
        'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg shadow-lg',
    },
    gift: {
      cardClassName:
        'card bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
    },
    card: {
      cardClassName:
        'card card-cards bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
    },
  },
  easter: {
    task: {
      cardClassName:
        'bg-gradient-to-br from-yellow-50 to-green-50 dark:from-yellow-900/20 dark:to-green-900/20 rounded-lg shadow-lg',
    },
    gift: {
      cardClassName:
        'card bg-gradient-to-br from-yellow-50 to-green-50 dark:from-yellow-900/20 dark:to-green-900/20',
    },
    card: {
      cardClassName:
        'card card-cards bg-gradient-to-br from-yellow-50 to-green-50 dark:from-yellow-900/20 dark:to-green-900/20',
    },
  },
  'mothers-day': {
    task: {
      cardClassName:
        'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg shadow-lg',
    },
    gift: {
      cardClassName:
        'card bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
    },
    card: {
      cardClassName:
        'card card-cards bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
    },
    event: {
      cardClassName:
        'card card-events bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
    },
  },
  'fourth-of-july': {
    task: {
      cardClassName:
        'bg-gradient-to-br from-red-50 to-blue-50 dark:from-red-900/20 dark:to-blue-900/20 rounded-lg shadow-lg',
    },
    gift: {
      cardClassName:
        'card bg-gradient-to-br from-red-50 to-blue-50 dark:from-red-900/20 dark:to-blue-900/20',
    },
    card: {
      cardClassName:
        'card card-cards bg-gradient-to-br from-red-50 to-blue-50 dark:from-red-900/20 dark:to-blue-900/20',
    },
  },
  kwanzaa: {
    task: {
      cardClassName:
        'bg-gradient-to-br from-red-50 to-green-50 dark:from-red-900/20 dark:to-green-900/20 rounded-lg shadow-lg',
    },
    gift: {
      cardClassName:
        'card bg-gradient-to-br from-red-50 to-green-50 dark:from-red-900/20 dark:to-green-900/20',
    },
    card: {
      cardClassName:
        'card card-cards bg-gradient-to-br from-red-50 to-green-50 dark:from-red-900/20 dark:to-green-900/20',
    },
  },
  'new-year': {
    task: {
      cardClassName:
        'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg shadow-lg',
    },
    gift: {
      cardClassName:
        'card bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
    },
    card: {
      cardClassName:
        'card card-cards bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
    },
    event: {
      cardClassName:
        'card card-events bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
    },
    decoration: {
      cardClassName:
        'card card-decorations bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
    },
    supply: {
      cardClassName:
        'card card-supplies bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
    },
    resolution: {
      cardClassName:
        'card card-resolutions bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
    },
  },
  'fathers-day': {
    task: {
      cardClassName:
        'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-lg',
    },
    gift: {
      cardClassName:
        'card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    },
    card: {
      cardClassName:
        'card card-cards bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    },
    event: {
      cardClassName:
        'card card-events bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    },
  },
  birthday: {
    task: {
      cardClassName:
        'bg-gradient-to-br from-pink-50 to-yellow-50 dark:from-pink-900/20 dark:to-yellow-900/20 rounded-lg shadow-lg',
    },
    gift: {
      cardClassName:
        'card bg-gradient-to-br from-pink-50 to-yellow-50 dark:from-pink-900/20 dark:to-yellow-900/20',
    },
    card: {
      cardClassName:
        'card card-cards bg-gradient-to-br from-pink-50 to-yellow-50 dark:from-pink-900/20 dark:to-yellow-900/20',
    },
    event: {
      cardClassName:
        'card card-events bg-gradient-to-br from-pink-50 to-yellow-50 dark:from-pink-900/20 dark:to-yellow-900/20',
    },
  },
  'baby-shower': {
    task: {
      cardClassName:
        'bg-gradient-to-br from-pink-50 to-blue-50 dark:from-pink-900/20 dark:to-blue-900/20 rounded-lg shadow-lg',
    },
    gift: {
      cardClassName:
        'card bg-gradient-to-br from-pink-50 to-blue-50 dark:from-pink-900/20 dark:to-blue-900/20',
    },
    game: {
      cardClassName:
        'card bg-gradient-to-br from-pink-50 to-blue-50 dark:from-pink-900/20 dark:to-blue-900/20',
    },
    'guest-list': {
      cardClassName:
        'card bg-gradient-to-br from-pink-50 to-blue-50 dark:from-pink-900/20 dark:to-blue-900/20',
    },
  },
  anniversary: {
    task: {
      cardClassName:
        'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg shadow-lg',
    },
    gift: {
      cardClassName:
        'card bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
    },
    card: {
      cardClassName:
        'card card-cards bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
    },
    event: {
      cardClassName:
        'card card-events bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
    },
  },
  graduation: {
    task: {
      cardClassName:
        'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg shadow-lg',
    },
    gift: {
      cardClassName:
        'card bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20',
    },
    card: {
      cardClassName:
        'card card-cards bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20',
    },
    event: {
      cardClassName:
        'card card-events bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20',
    },
    'guest-list': {
      cardClassName:
        'card bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20',
    },
  },
} as const;

export type ContentType = keyof typeof BASE_FORM_CONFIGS;
export type HolidayKey = keyof typeof HOLIDAY_CUSTOMIZATIONS;
