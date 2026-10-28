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
