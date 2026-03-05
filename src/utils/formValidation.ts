/**
 * Utility functions for form validation to prevent trim() errors
 */

/**
 * Safely checks if a string value is empty (null, undefined, or empty after trimming)
 * @param value - The value to check
 * @returns true if the value is empty, false otherwise
 */
export function isEmptyString(value: any): boolean {
  return !value || (typeof value === 'string' && !value.trim());
}

/**
 * Safely checks if a number value is empty (null, undefined, or empty string)
 * @param value - The value to check
 * @returns true if the value is empty, false otherwise
 */
export function isEmptyNumber(value: any): boolean {
  return value === undefined || value === null || value === '';
}

/**
 * Validates required fields based on their type
 * @param formValues - The form values object
 * @param requiredFields - Array of field objects with id and type
 * @returns Array of missing field IDs
 */
export function validateRequiredFields(
  formValues: Record<string, any>,
  requiredFields: Array<{ id: string; type?: string }>,
): string[] {
  return requiredFields
    .filter(field => {
      const value = formValues[field.id];
      if (field.type === 'number') {
        return isEmptyNumber(value);
      }
      return isEmptyString(value);
    })
    .map(field => field.id);
}

/**
 * Checks if a form has all required fields filled
 * @param formValues - The form values object
 * @param requiredFields - Array of field objects with id and type
 * @returns true if all required fields are filled, false otherwise
 */
export function hasAllRequiredFields(
  formValues: Record<string, any>,
  requiredFields: Array<{ id: string; type?: string }>,
): boolean {
  return validateRequiredFields(formValues, requiredFields).length === 0;
}

/**
 * Validates email format
 * @param email - The email string to validate
 * @returns true if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  // Basic email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}
