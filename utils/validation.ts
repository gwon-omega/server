/**
 * Utility functions for input validation
 */

/**
 * Validates if a string is a valid UUID v4
 * @param uuid - The string to validate
 * @returns boolean - True if valid UUID, false otherwise
 */
export const validateUuid = (uuid: string): boolean => {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validates if a string is a valid email address
 * @param email - The email string to validate
 * @returns boolean - True if valid email, false otherwise
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates if a value is a positive number
 * @param value - The value to validate
 * @returns boolean - True if positive number, false otherwise
 */
export const validatePositiveNumber = (value: any): boolean => {
  return typeof value === 'number' && value > 0 && !isNaN(value);
};

/**
 * Validates if a string has minimum and maximum length
 * @param str - The string to validate
 * @param min - Minimum length (default: 1)
 * @param max - Maximum length (default: 255)
 * @returns boolean - True if within range, false otherwise
 */
export const validateStringLength = (str: string, min: number = 1, max: number = 255): boolean => {
  if (!str || typeof str !== 'string') {
    return false;
  }

  const trimmed = str.trim();
  return trimmed.length >= min && trimmed.length <= max;
};

/**
 * Sanitizes a string by removing potentially harmful characters
 * @param str - The string to sanitize
 * @returns string - Sanitized string
 */
export const sanitizeString = (str: string): string => {
  if (!str || typeof str !== 'string') {
    return '';
  }

  return str
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Validates if an array contains only valid UUIDs
 * @param arr - Array to validate
 * @returns boolean - True if all elements are valid UUIDs, false otherwise
 */
export const validateUuidArray = (arr: any[]): boolean => {
  if (!Array.isArray(arr)) {
    return false;
  }

  return arr.every(item => validateUuid(item));
};

/**
 * Validates pagination parameters
 * @param page - Page number
 * @param limit - Items per page
 * @returns object - Validation result with normalized values
 */
export const validatePagination = (page?: any, limit?: any) => {
  const normalizedPage = Math.max(1, parseInt(page) || 1);
  const normalizedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));

  return {
    isValid: true,
    page: normalizedPage,
    limit: normalizedLimit,
    offset: (normalizedPage - 1) * normalizedLimit
  };
};

export default {
  validateUuid,
  validateEmail,
  validatePositiveNumber,
  validateStringLength,
  sanitizeString,
  validateUuidArray,
  validatePagination
};
