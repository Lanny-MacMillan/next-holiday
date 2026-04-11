import { FormField } from '@/types/form';

// Re-export legacy interface for backward compatibility
export interface FormConfig {
  title: string;
  fields: FormField[];
  submitText: string;
  cancelText: string;
  cardClassName: string;
  submitButtonColor: string;
  showAddressBook?: boolean;
  customTitle?: string;
  customFieldLabel?: string;
  customSubmitText?: string;
}

// Cards form configuration
export const cardsFormConfig: FormConfig = {
  title: 'Add New Card',
  fields: [
    {
      id: 'recipient',
      type: 'text',
      placeholder: 'Recipient*',
      required: true,
    },
    {
      id: 'address',
      type: 'text',
      placeholder: 'Address',
    },
    {
      id: 'message',
      type: 'textarea',
      placeholder: 'Message*',
      required: true,
      rows: 3,
    },
  ],
  submitText: 'Add Card',
  cancelText: 'Cancel',
  cardClassName: 'card card-cards',
  submitButtonColor: '#ef4444', // Red
  showAddressBook: true,
};

// Tasks form configuration
export const tasksFormConfig: FormConfig = {
  title: 'Add New Task',
  fields: [
    {
      id: 'title',
      type: 'text',
      placeholder: 'Task Title*',
      required: true,
    },
    {
      id: 'description',
      type: 'textarea',
      placeholder: 'Description',
      rows: 2,
    },
    {
      id: 'priority',
      type: 'select',
      placeholder: 'Priority',
      options: [
        { value: 'low', label: 'Low Priority' },
        { value: 'medium', label: 'Medium Priority' },
        { value: 'high', label: 'High Priority' },
      ],
    },
    {
      id: 'assignedTo',
      type: 'text',
      placeholder: 'Assigned To',
    },
    {
      id: 'dueDate',
      type: 'date',
      placeholder: 'Due Date',
    },
  ],
  submitText: 'Add Task',
  cancelText: 'Cancel',
  cardClassName: 'bg-white dark:bg-gray-800 rounded-lg shadow-lg',
  submitButtonColor: '#22c55e', // Green
};

// Events form configuration
export const eventsFormConfig: FormConfig = {
  title: 'Add New Event Task',
  fields: [
    {
      id: 'title',
      type: 'text',
      placeholder: 'Event Task Title*',
      required: true,
    },
    {
      id: 'description',
      type: 'textarea',
      placeholder: 'Description',
      rows: 2,
    },
    {
      id: 'priority',
      type: 'select',
      placeholder: 'Priority',
      options: [
        { value: 'low', label: 'Low Priority' },
        { value: 'medium', label: 'Medium Priority' },
        { value: 'high', label: 'High Priority' },
      ],
    },
    {
      id: 'assignedTo',
      type: 'text',
      placeholder: 'Assigned To',
    },
    {
      id: 'dueDate',
      type: 'date',
      placeholder: 'Due Date',
    },
  ],
  submitText: 'Add Event Task',
  cancelText: 'Cancel',
  cardClassName: 'bg-white dark:bg-gray-800 rounded-lg shadow-lg',
  submitButtonColor: '#3b82f6', // Blue for events
};

// Gifts form configuration
export const giftsFormConfig: FormConfig = {
  title: 'Add New Gift',
  fields: [
    {
      id: 'recipient',
      type: 'text',
      placeholder: 'Recipient*',
      required: true,
    },
    {
      id: 'description',
      type: 'text',
      placeholder: 'Gift',
    },
    {
      id: 'price',
      type: 'number',
      placeholder: 'Price',
      step: '0.01',
    },
    {
      id: 'store',
      type: 'text',
      placeholder: 'Store',
    },
    {
      id: 'productLink',
      type: 'url',
      placeholder: 'Product Link',
    },
    {
      id: 'notes',
      type: 'textarea',
      placeholder: 'Notes',
      rows: 2,
    },
  ],
  submitText: 'Add Gift',
  cancelText: 'Cancel',
  cardClassName: 'card',
  submitButtonColor: '#eab308', // Yellow
  showAddressBook: true,
};

// Shopping list form configuration (for shopping-list pages like Thanksgiving)
export const shoppingListFormConfig: FormConfig = {
  title: 'Add New Shopping Item',
  fields: [
    {
      id: 'name',
      type: 'text',
      placeholder: 'Item Name*',
      required: true,
    },
    {
      id: 'description',
      type: 'text',
      placeholder: 'Description',
    },
    {
      id: 'price',
      type: 'number',
      placeholder: 'Estimated Price',
      step: '0.01',
    },
    {
      id: 'actual_price',
      type: 'number',
      placeholder: 'Actual Price',
      step: '0.01',
    },
    {
      id: 'store',
      type: 'text',
      placeholder: 'Store',
    },
    {
      id: 'product_link',
      type: 'url',
      placeholder: 'Product Link',
    },
    {
      id: 'notes',
      type: 'textarea',
      placeholder: 'Notes',
      rows: 2,
    },
  ],
  submitText: 'Add Item',
  cancelText: 'Cancel',
  cardClassName: 'card',
  submitButtonColor: '#eab308', // Yellow for Thanksgiving
  showAddressBook: false, // No address book for shopping
};

// Supplies form configuration (for supplies-list and shopping-list pages)
export const suppliesFormConfig: FormConfig = {
  title: 'Add New Supply Item',
  fields: [
    {
      id: 'name',
      type: 'text',
      placeholder: 'Item Name*',
      required: true,
    },
    {
      id: 'description',
      type: 'text',
      placeholder: 'Description',
    },
    {
      id: 'price',
      type: 'number',
      placeholder: 'Estimated Price',
      step: '0.01',
    },
    {
      id: 'actual_price',
      type: 'number',
      placeholder: 'Actual Price',
      step: '0.01',
    },
    {
      id: 'store',
      type: 'text',
      placeholder: 'Store',
    },
    {
      id: 'product_link',
      type: 'url',
      placeholder: 'Product Link',
    },
    {
      id: 'notes',
      type: 'textarea',
      placeholder: 'Notes',
      rows: 2,
    },
  ],
  submitText: 'Add Supply Item',
  cancelText: 'Cancel',
  cardClassName: 'card',
  submitButtonColor: '#f59e0b', // Amber for supplies
  showAddressBook: false, // No address book for supplies
};

// Edit configurations (for editing existing items)
export const editCardsFormConfig: FormConfig = {
  ...cardsFormConfig,
  title: 'Edit Card',
  submitText: 'Update Card',
};

export const editTasksFormConfig: FormConfig = {
  ...tasksFormConfig,
  title: 'Edit Task',
  submitText: 'Update Task',
};

export const editEventsFormConfig: FormConfig = {
  ...eventsFormConfig,
  title: 'Edit Event Task',
  submitText: 'Update Event Task',
};

export const editGiftsFormConfig: FormConfig = {
  ...giftsFormConfig,
  title: 'Edit Gift',
  submitText: 'Update Gift',
};

export const editSuppliesFormConfig: FormConfig = {
  ...suppliesFormConfig,
  title: 'Edit Supply Item',
  submitText: 'Update Supply Item',
};

export const editShoppingListFormConfig: FormConfig = {
  ...shoppingListFormConfig,
  title: 'Edit Item',
  submitText: 'Update Item',
};

// Guest list form configuration (simplified for current database schema)
export const guestsFormConfig: FormConfig = {
  title: 'Add New Guest',
  fields: [
    {
      id: 'name',
      type: 'text',
      placeholder: 'Guest Name*',
      required: true,
    },
    {
      id: 'email',
      type: 'email',
      placeholder: 'Email',
    },
    {
      id: 'phone',
      type: 'tel',
      placeholder: 'Phone',
    },
    {
      id: 'address',
      type: 'text',
      placeholder: 'Address',
    },
    {
      id: 'rsvpStatus',
      type: 'select',
      placeholder: 'RSVP Status',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'declined', label: 'Declined' },
      ],
    },
    {
      id: 'notes',
      type: 'textarea',
      placeholder: 'Notes',
      rows: 2,
    },
  ],
  submitText: 'Add Guest',
  cancelText: 'Cancel',
  cardClassName: 'card',
  submitButtonColor: '#f97316', // Orange for thanksgiving
  showAddressBook: true,
};

export const editGuestsFormConfig: FormConfig = {
  ...guestsFormConfig,
  title: 'Edit Guest',
  submitText: 'Update Guest',
};

// Helper function to get form config based on type and mode
// Optional parameters:
// - customTitle: Override the modal title (e.g., "Edit Date Idea" instead of "Edit Task")
// - customFieldLabel: Override the title field placeholder (e.g., "Date Idea Title*" instead of "Task Title*")
// - customSubmitText: Override the submit button text (e.g., "Update Date" instead of "Update Task")
// Address book form configuration
export const addressBookFormConfig: FormConfig = {
  title: 'Add New Contact',
  fields: [
    {
      id: 'name',
      type: 'text',
      placeholder: 'Name*',
      required: true,
    },
    {
      id: 'email',
      type: 'email',
      placeholder: 'Email',
    },
    {
      id: 'phone',
      type: 'tel',
      placeholder: 'Phone*',
      required: true,
    },
    {
      id: 'streetAddress',
      type: 'text',
      placeholder: 'Street Address*',
      required: true,
    },
    {
      id: 'city',
      type: 'text',
      placeholder: 'City*',
      required: true,
    },
    {
      id: 'state',
      type: 'select',
      placeholder: 'State*',
      required: true,
      options: [
        { value: 'AL', label: 'Alabama' },
        { value: 'AK', label: 'Alaska' },
        { value: 'AZ', label: 'Arizona' },
        { value: 'AR', label: 'Arkansas' },
        { value: 'CA', label: 'California' },
        { value: 'CO', label: 'Colorado' },
        { value: 'CT', label: 'Connecticut' },
        { value: 'DE', label: 'Delaware' },
        { value: 'FL', label: 'Florida' },
        { value: 'GA', label: 'Georgia' },
        { value: 'HI', label: 'Hawaii' },
        { value: 'ID', label: 'Idaho' },
        { value: 'IL', label: 'Illinois' },
        { value: 'IN', label: 'Indiana' },
        { value: 'IA', label: 'Iowa' },
        { value: 'KS', label: 'Kansas' },
        { value: 'KY', label: 'Kentucky' },
        { value: 'LA', label: 'Louisiana' },
        { value: 'ME', label: 'Maine' },
        { value: 'MD', label: 'Maryland' },
        { value: 'MA', label: 'Massachusetts' },
        { value: 'MI', label: 'Michigan' },
        { value: 'MN', label: 'Minnesota' },
        { value: 'MS', label: 'Mississippi' },
        { value: 'MO', label: 'Missouri' },
        { value: 'MT', label: 'Montana' },
        { value: 'NE', label: 'Nebraska' },
        { value: 'NV', label: 'Nevada' },
        { value: 'NH', label: 'New Hampshire' },
        { value: 'NJ', label: 'New Jersey' },
        { value: 'NM', label: 'New Mexico' },
        { value: 'NY', label: 'New York' },
        { value: 'NC', label: 'North Carolina' },
        { value: 'ND', label: 'North Dakota' },
        { value: 'OH', label: 'Ohio' },
        { value: 'OK', label: 'Oklahoma' },
        { value: 'OR', label: 'Oregon' },
        { value: 'PA', label: 'Pennsylvania' },
        { value: 'RI', label: 'Rhode Island' },
        { value: 'SC', label: 'South Carolina' },
        { value: 'SD', label: 'South Dakota' },
        { value: 'TN', label: 'Tennessee' },
        { value: 'TX', label: 'Texas' },
        { value: 'UT', label: 'Utah' },
        { value: 'VT', label: 'Vermont' },
        { value: 'VA', label: 'Virginia' },
        { value: 'WA', label: 'Washington' },
        { value: 'WV', label: 'West Virginia' },
        { value: 'WI', label: 'Wisconsin' },
        { value: 'WY', label: 'Wyoming' },
      ],
    },
    {
      id: 'zipCode',
      type: 'text',
      placeholder: 'Zip Code*',
      required: true,
    },
    {
      id: 'relationship',
      type: 'select',
      placeholder: 'Relationship (Optional)',
      options: [
        { value: 'Spouse / Partner', label: 'Spouse / Partner' },
        { value: 'Child', label: 'Child' },
        { value: 'Parent', label: 'Parent' },
        { value: 'Sibling', label: 'Sibling' },
        { value: 'Grandparent', label: 'Grandparent' },
        { value: 'Grandchild', label: 'Grandchild' },
        { value: 'Aunt / Uncle', label: 'Aunt / Uncle' },
        { value: 'Cousin', label: 'Cousin' },
        { value: 'In-law', label: 'In-law' },
        { value: 'Friend', label: 'Friend' },
        { value: 'Family Friend', label: 'Family Friend' },
        { value: 'Neighbor', label: 'Neighbor' },
        { value: 'Co-worker', label: 'Co-worker' },
        { value: 'Teacher', label: 'Teacher' },
        { value: 'Coach', label: 'Coach' },
        { value: 'Godparent / Godchild', label: 'Godparent / Godchild' },
        { value: 'Other', label: 'Other' },
      ],
    },
    {
      id: 'notes',
      type: 'textarea',
      placeholder: 'Notes',
      rows: 2,
    },
  ],
  submitText: 'Add Contact',
  cancelText: 'Cancel',
  cardClassName: 'card card-address',
  submitButtonColor: '#ec4899', // Pink
};

export const editAddressBookFormConfig: FormConfig = {
  ...addressBookFormConfig,
  title: 'Edit Contact',
  submitText: 'Update Contact',
};

export function getFormConfig(
  type:
    | 'cards'
    | 'tasks'
    | 'events'
    | 'gifts'
    | 'guests'
    | 'addressBook'
    | 'supplies'
    | 'shopping-list'
    | 'shopping',
  mode: 'add' | 'edit' = 'add',
  customTitle?: string,
  customFieldLabel?: string,
  customSubmitText?: string,
): FormConfig {
  const configs = {
    cards: mode === 'add' ? cardsFormConfig : editCardsFormConfig,
    tasks: mode === 'add' ? tasksFormConfig : editTasksFormConfig,
    events: mode === 'add' ? eventsFormConfig : editEventsFormConfig,
    gifts: mode === 'add' ? giftsFormConfig : editGiftsFormConfig,
    supplies: mode === 'add' ? suppliesFormConfig : editSuppliesFormConfig,
    guests: mode === 'add' ? guestsFormConfig : editGuestsFormConfig,
    addressBook: mode === 'add' ? addressBookFormConfig : editAddressBookFormConfig,
    'shopping-list':
      mode === 'add' ? shoppingListFormConfig : editShoppingListFormConfig,
    shopping: mode === 'add' ? giftsFormConfig : editGiftsFormConfig, // Use gifts config as base for shopping
  };

  const baseConfig = configs[type];

  // If custom values are provided, create a modified config
  if (customTitle || customFieldLabel || customSubmitText) {
    const modifiedConfig = { ...baseConfig };

    if (customTitle) {
      modifiedConfig.title = customTitle;
    }

    if (customFieldLabel) {
      // Update the title field placeholder if it exists
      modifiedConfig.fields = baseConfig.fields.map(field => {
        if (field.id === 'title') {
          return {
            ...field,
            placeholder: customFieldLabel,
          };
        }
        return field;
      });
    }

    if (customSubmitText) {
      modifiedConfig.submitText = customSubmitText;
    }

    return modifiedConfig;
  }

  return baseConfig;
}

// ============================================================================
// NEW FORM BUILDER COMPATIBILITY LAYER
// ============================================================================
// This section provides compatibility between old formConfigs and new form builder

import {
  buildFormConfig as newBuildFormConfig,
  ShareMember,
  shouldShowAssignTo,
  enhanceShareMembersWithCurrentUser,
} from '@/lib/formBuilder';
import { HolidayKey, ContentType } from '@/config/baseFormConfigs';

/**
 * Enhanced getFormConfig that can work with the new form builder system
 * Maintains backward compatibility while adding assignTo support
 */
export function getFormConfigEnhanced(
  type:
    | 'cards'
    | 'tasks'
    | 'events'
    | 'gifts'
    | 'guests'
    | 'addressBook'
    | 'supplies'
    | 'shopping-list'
    | 'shopping',
  mode: 'add' | 'edit' = 'add',
  options?: {
    customTitle?: string;
    customFieldLabel?: string;
    customSubmitText?: string;
    holidayKey?: HolidayKey;
    shareMembers?: ShareMember[];
    auth0User?: { sub?: string; name?: string; email?: string } | null;
  },
): FormConfig {
  // Enhance shareMembers with current user for self-assignment functionality
  const enhancedShareMembers = options?.shareMembers
    ? enhanceShareMembersWithCurrentUser(options.shareMembers, options.auth0User)
    : options?.shareMembers || [];

  // If we have a holidayKey, use the new form builder for supported types
  // This ensures consistent field behavior (like address book) even for non-shared holidays
  if (options?.holidayKey) {
    const contentTypeMapping: Partial<Record<typeof type, ContentType>> = {
      tasks: 'task',
      events: 'task', // Events are stored as tasks with category="Events"
      gifts: 'gift',
      cards: 'card',
      guests: 'guest-list', // Map guests to guest-list configuration
      'shopping-list': 'shopping', // Map shopping-list to shopping configuration
      shopping: 'shopping', // Map shopping to shopping configuration
      supplies: 'supplies', // Map supplies to supplies configuration without address book
    };

    const contentType = contentTypeMapping[type];
    if (contentType) {
      const newConfig = newBuildFormConfig(
        contentType,
        options.holidayKey,
        enhancedShareMembers,
        {
          submitText: options.customSubmitText,
        },
      );

      // Convert new FormConfig to legacy FormConfig format
      return {
        title:
          options.customTitle ||
          `${mode === 'add' ? 'Add' : 'Edit'} ${type.slice(0, -1)}`,
        fields: newConfig.fields,
        submitText: newConfig.submitText,
        cancelText: 'Cancel',
        cardClassName: newConfig.cardClassName || 'card',
        submitButtonColor: '#3b82f6',
        showAddressBook: newConfig.showAddressBook,
        customTitle: options.customTitle,
        customFieldLabel: options.customFieldLabel,
        customSubmitText: options.customSubmitText,
      };
    }
  }

  // Fallback to original getFormConfig for unsupported types or when no shareMembers
  return getFormConfig(
    type,
    mode,
    options?.customTitle,
    options?.customFieldLabel,
    options?.customSubmitText,
  );
}
