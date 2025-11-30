import type { RegisterRequest } from '@/services/api/types';

export interface ValidationErrors {
  login?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  lang_code?: string;
}

export interface RegisterFormData {
  login: string;
  password: string;
  first_name: string;
  last_name?: string;
  email?: string;
  lang_code: 'ru' | 'en';
}

/**
 * Validates login according to backend requirements:
 * - Starts with a letter
 * - Followed by 6 to 20 alphanumeric characters or underscores
 * - Total length: 6-20 characters
 */
export function validateLogin(login: string): string | undefined {
  if (!login) {
    return 'Login is required';
  }

  if (login.length < 6 || login.length > 20) {
    return 'Login must be between 6 and 20 characters';
  }

  const pattern = /^[a-zA-Z][a-zA-Z0-9_]{5,19}$/;
  if (!pattern.test(login)) {
    return 'Login must start with a letter, followed by 6 to 20 alphanumeric characters or underscores';
  }

  return undefined;
}

/**
 * Validates password according to backend requirements:
 * - Minimum length: 6 characters
 * - Maximum length: 255 characters
 */
export function validatePassword(password: string): string | undefined {
  if (!password) {
    return 'Password is required';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }

  if (password.length > 255) {
    return 'Password must not exceed 255 characters';
  }

  return undefined;
}

/**
 * Validates name according to backend requirements:
 * - Contains 1 to 255 characters
 * - Only English and Russian letters
 */
export function validateName(name: string, fieldName: string): string | undefined {
  if (!name) {
    return `${fieldName} is required`;
  }

  if (name.length < 1 || name.length > 255) {
    return `${fieldName} must be between 1 and 255 characters`;
  }

  const pattern = /^[a-zA-Zа-яА-ЯёЁ]+$/;
  if (!pattern.test(name)) {
    return `${fieldName} must contain only English or Russian letters`;
  }

  return undefined;
}

/**
 * Validates optional last name
 */
export function validateLastName(lastName: string | undefined): string | undefined {
  if (!lastName || lastName.trim() === '') {
    return undefined; // Optional field
  }

  return validateName(lastName, 'Last name');
}

/**
 * Validates email format (if provided)
 */
export function validateEmail(email: string | undefined): string | undefined {
  if (!email || email.trim() === '') {
    return undefined; // Optional field
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return 'Invalid email format';
  }

  return undefined;
}

/**
 * Validates language code
 */
export function validateLangCode(langCode: string): string | undefined {
  if (langCode !== 'ru' && langCode !== 'en') {
    return 'Language must be either "ru" or "en"';
  }

  return undefined;
}

/**
 * Validates all registration form fields from RegisterRequest
 */
export function validateRegisterForm(data: RegisterRequest): ValidationErrors {
  const errors: ValidationErrors = {};

  const loginError = validateLogin(data.user.login);
  if (loginError) {
    errors.login = loginError;
  }

  const passwordError = validatePassword(data.user.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  const firstNameError = validateName(data.profile.first_name, 'First name');
  if (firstNameError) {
    errors.first_name = firstNameError;
  }

  const lastNameError = validateLastName(data.profile.last_name);
  if (lastNameError) {
    errors.last_name = lastNameError;
  }

  const emailError = validateEmail(data.profile.email);
  if (emailError) {
    errors.email = emailError;
  }

  const langCodeError = validateLangCode(data.profile.lang_code);
  if (langCodeError) {
    errors.lang_code = langCodeError;
  }

  return errors;
}

/**
 * Checks if validation errors object has any errors
 */
export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
