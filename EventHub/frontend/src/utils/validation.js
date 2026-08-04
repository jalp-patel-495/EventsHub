/**
 * Validation utility for Email, Phone, and Name fields.
 */

// Email regex matching standard format: name@domain.tld (min 2 chars for TLD)
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Name regex: strictly alphabetic letters, allows single space between words (e.g. "Mary Jane")
export const NAME_REGEX = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

// Phone regex: 10 digits starting with 6, 7, 8, or 9
export const PHONE_REGEX = /^[6-9]\d{9}$/;

// List of common dummy sequential numbers to block
const DUMMY_SEQUENCES = [
  '1234567890',
  '0123456789',
  '9876543210',
  '0987654321',
  '2345678901'
];

/**
 * Validates a person's name (First Name or Last Name).
 * @param {string} name 
 * @param {string} fieldLabel 
 * @returns {string|null} Error message or null if valid.
 */
export const validateName = (name, fieldLabel = 'Name') => {
  if (!name || !name.trim()) {
    return `${fieldLabel} is required.`;
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return `${fieldLabel} must be at least 2 characters long.`;
  }

  if (trimmed.length > 50) {
    return `${fieldLabel} cannot exceed 50 characters.`;
  }

  if (!NAME_REGEX.test(trimmed)) {
    return `${fieldLabel} must only contain alphabetical characters.`;
  }

  // Check for repeating single character e.g. "aaaaa", "zzzz"
  if (/^(.)\1+$/i.test(trimmed)) {
    return `Please enter a valid ${fieldLabel.toLowerCase()}.`;
  }

  return null;
};

/**
 * Validates a mobile phone number.
 * @param {string} phone 
 * @returns {string|null} Error message or null if valid.
 */
export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return 'Phone number is required.';
  }

  const trimmed = phone.trim();

  if (!/^\d+$/.test(trimmed)) {
    return 'Phone number must contain digits only.';
  }

  if (trimmed.length !== 10) {
    return 'Phone number must be exactly 10 digits.';
  }

  // Check for all identical digits like 0000000000, 1111111111, 9999999999
  if (/^(\d)\1{9}$/.test(trimmed)) {
    return 'Please enter a valid 10-digit mobile number (repeating digits like 0000000000 are not allowed).';
  }

  // Check for dummy sequential numbers
  if (DUMMY_SEQUENCES.includes(trimmed)) {
    return 'Please enter a valid, non-dummy 10-digit mobile number.';
  }

  if (!PHONE_REGEX.test(trimmed)) {
    return 'Phone number must be a valid 10-digit mobile number starting with 6, 7, 8, or 9.';
  }

  return null;
};

/**
 * Validates an email address.
 * @param {string} email 
 * @returns {string|null} Error message or null if valid.
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return 'Email address is required.';
  }

  const trimmed = email.trim();

  if (trimmed.length > 100) {
    return 'Email address cannot exceed 100 characters.';
  }

  if (trimmed.includes('..') || trimmed.includes(' ')) {
    return 'Please enter a valid email address.';
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Please enter a valid email address (e.g. user@example.com).';
  }

  return null;
};
