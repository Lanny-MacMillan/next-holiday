import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { isEmptyString, isEmptyNumber, isValidEmail } from '@/utils/formValidation';
import { FormField } from '@/types/form';
import { ShareMember } from '@/lib/formBuilder';

export interface FormModalProps {
  isOpen: boolean;
  title: string;
  fields: FormField[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  onClose: () => void;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
  cardClassName?: string;
  submitButtonColor?: string;
  showAddressBook?: boolean;
  contacts?: any[];
  onAddressBookSelect?: (contact: any) => void;
  // New props for enhanced functionality
  holidayId?: string;
  shareMembers?: ShareMember[];
}

export default function FormModal({
  isOpen,
  title,
  fields,
  initialValues = {},
  onSubmit,
  onClose,
  loading = false,
  submitText = 'Submit',
  cancelText = 'Cancel',
  cardClassName = 'card',
  submitButtonColor = '#3b82f6',
  showAddressBook = false,
  contacts = [],
  onAddressBookSelect,
  holidayId,
  shareMembers = [],
}: FormModalProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [showAddressBookInternal, setShowAddressBookInternal] = useState(false);
  const [showAddressBookMessage, setShowAddressBookMessage] = useState(false);

  // Check if any field has address book enabled
  const hasAddressBookFields = fields.some(field => field.showAddressBook === true);

  // Populate assignTo field options with share members
  const fieldsWithOptions = useMemo(
    () =>
      fields.map(field => {
        if (field.id === 'assigned_to' && shareMembers.length > 0) {
          return {
            ...field,
            options: [
              { value: '', label: 'Unassigned' },
              ...shareMembers
                .map(member => ({
                  value: (member as any).uuid, // Use UUID for API compatibility, no fallback to userId
                  label: member.name || member.email || 'Unknown',
                }))
                .filter(option => option.value), // Filter out members without valid UUIDs,
            ],
          };
        }
        return field;
      }),
    [fields, shareMembers],
  );

  const handleAddressBookSelect = (contact: any) => {
    // Build full address from contact details
    const addressParts = [
      contact.streetAddress,
      contact.city,
      contact.state,
      contact.postalCode || contact.zipCode,
    ].filter(Boolean);

    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : '';

    setFormValues(prev => {
      // Check which fields exist in the form to determine what to set
      const hasRecipientField = fields.some(f => f.id === 'recipient');
      const hasNameField = fields.some(f => f.id === 'name');
      const hasGiftNameField = fields.some(
        f => f.id === 'name' && fields.some(gf => gf.id === 'recipient'),
      ); // Gift form has both recipient and name

      const updates: any = {
        ...prev,
        address: fullAddress,
        email: contact.email || '',
        phone: contact.phone || '',
      };

      // For gift forms (has both recipient and name), only set recipient
      if (hasRecipientField && hasGiftNameField) {
        updates.recipient = contact.name;
      }
      // For guest forms (has name but no recipient), set name
      else if (hasNameField && !hasRecipientField) {
        updates.name = contact.name;
      }
      // For other forms with recipient field, set recipient
      else if (hasRecipientField) {
        updates.recipient = contact.name;
      }

      return updates;
    });
    setShowAddressBookInternal(false);
    setShowAddressBookMessage(false); // Hide message when selecting from address book
  };

  useEffect(() => {
    if (isOpen) {
      // Reset address book states BEFORE setting form values to prevent flash
      setShowAddressBookInternal(false);
      setShowAddressBookMessage(false);
      setFormValues(initialValues);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if all required fields are filled
    const requiredFields = fieldsWithOptions.filter(field => field.required);
    const missingFields = requiredFields.filter(field => {
      const value = formValues[field.id];
      // Handle different field types for validation
      if (field.type === 'number') {
        return isEmptyNumber(value);
      }
      // For text-based fields, check if string is empty after trimming
      return isEmptyString(value);
    });

    if (missingFields.length > 0) {
      alert(
        `Please fill in all required fields: ${missingFields
          .map(f => f.placeholder || f.id)
          .join(', ')}`,
      );
      return;
    }

    // Validate email fields if they have values
    const emailFields = fieldsWithOptions.filter(field => field.type === 'email');
    const invalidEmails = emailFields.filter(field => {
      const value = formValues[field.id];
      // Only validate if email field has a value (since it's optional)
      return value && !isValidEmail(value);
    });

    if (invalidEmails.length > 0) {
      alert(
        `Please enter valid email addresses for: ${invalidEmails
          .map(f => f.placeholder || f.id)
          .join(', ')}`,
      );
      return;
    }

    onSubmit(formValues);
  };

  const handleClose = () => {
    setFormValues({});
    setShowAddressBookInternal(false);
    setShowAddressBookMessage(false);
    onClose();
  };

  const handleInputChange = (fieldId: string, value: any) => {
    // Find the field to determine its type
    const field = fieldsWithOptions.find(f => f.id === fieldId);

    // Convert value based on field type
    let processedValue = value;
    if (field?.type === 'number') {
      processedValue = value === '' ? 0 : parseFloat(value) || 0;
    }

    setFormValues(prev => ({
      ...prev,
      [fieldId]: processedValue,
    }));

    // Show address book message when user types in field with address book enabled
    const currentField = fields.find(f => f.id === fieldId);
    const fieldHasAddressBook = currentField?.showAddressBook === true;

    if (fieldHasAddressBook && value.trim()) {
      setShowAddressBookMessage(true);
    } else if (fieldHasAddressBook && !value.trim()) {
      setShowAddressBookMessage(false);
    }
  };

  const renderField = (field: FormField) => {
    const commonProps = {
      className: `border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 w-full ${
        field.className || ''
      }`,
      style: field.style,
      placeholder: field.placeholder,
      required: field.required,
      value: formValues[field.id] || '',
      onChange: (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) => handleInputChange(field.id, e.target.value),
    };

    switch (field.type) {
      case 'textarea':
        return <textarea {...commonProps} rows={field.rows || 3} />;
      case 'select':
        return (
          <select {...commonProps}>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'number':
        return <input {...commonProps} type="number" step={field.step || '1'} />;
      case 'date':
        // Format date value for HTML date input (expects YYYY-MM-DD)
        const dateValue = formValues[field.id];
        const formattedDate = dateValue
          ? new Date(dateValue).toISOString().split('T')[0]
          : '';
        return <input {...{ ...commonProps, value: formattedDate }} type="date" />;
      case 'url':
        return <input {...commonProps} type="url" />;
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={field.id}
              checked={formValues[field.id] || false}
              onChange={e => handleInputChange(field.id, e.target.checked)}
              className="mr-2 accent-green-500"
            />
            <label
              htmlFor={field.id}
              className="text-gray-700 dark:text-gray-300 text-sm"
            >
              {field.label}
            </label>
          </div>
        );
      default:
        return <input {...commonProps} type="text" />;
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4"
      onClick={e => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="card rounded-lg p-4 sm:p-6 max-w-md mx-auto w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-lg sm:text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {fieldsWithOptions.map(field => {
            // Check if this specific field should show address book
            const fieldShowsAddressBook = field.showAddressBook === true;

            return (
              <div key={field.id}>
                {/* Special handling for address book integration */}
                {fieldShowsAddressBook && (
                  <div className="flex gap-2">
                    <div className="flex-1">{renderField(field)}</div>
                    <button
                      type="button"
                      onClick={() =>
                        setShowAddressBookInternal(!showAddressBookInternal)
                      }
                      className="bg-blue-500 text-white px-2 sm:px-3 py-2 rounded text-xs sm:text-sm hover:bg-blue-600"
                    >
                      📖
                    </button>
                  </div>
                )}
                {/* Regular field rendering */}
                {!fieldShowsAddressBook && renderField(field)}

                {/* Address Book Message - shows when user types in field with address book enabled */}
                {fieldShowsAddressBook && showAddressBookMessage && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2 mt-2">
                    <div className="text-xs text-blue-700 dark:text-blue-300 flex items-start">
                      <span className="mr-1">ℹ️</span>
                      <span>
                        This guest will be automatically added to your address book.
                      </span>
                    </div>
                  </div>
                )}

                {/* Address Book Dropdown - positioned right after the specific field that has address book enabled */}
                {fieldShowsAddressBook && showAddressBookInternal && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 max-h-32 overflow-y-auto mt-2">
                    <h4 className="text-xs sm:text-sm font-medium mb-1 text-gray-900 dark:text-white">
                      From Address Book ({contacts.length} contacts):
                    </h4>
                    {contacts.length === 0 ? (
                      <div className="text-xs text-gray-500 dark:text-gray-400 p-1">
                        No contacts available. Add contacts in the Address Book
                        first.
                      </div>
                    ) : (
                      contacts.map((contact: any) => (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => {
                            handleAddressBookSelect(contact);
                          }}
                          className="block w-full text-left text-xs sm:text-sm p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-gray-900 dark:text-white"
                        >
                          <div className="font-medium">{contact.name}</div>
                          {contact.streetAddress && (
                            <div className="text-xs text-gray-500">
                              {contact.streetAddress}, {contact.city},{' '}
                              {contact.state} {contact.postalCode || contact.zipCode}
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              className="flex-1 text-white px-3 sm:px-4 py-2 rounded transition-colors text-sm sm:text-base"
              disabled={loading}
              style={{
                backgroundColor: submitButtonColor,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Processing...' : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
