export interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ValidationErrorResponse {
  detail: string | ValidationErrorDetail[];
}

/**
 * Parses FastAPI validation error response (422) into a user-friendly error message
 * @param response - Error response object with detail field
 * @returns Formatted error message string
 */
export function parseValidationError(response: ValidationErrorResponse): string {
  if (!response.detail) {
    return 'Validation error';
  }

  if (typeof response.detail === 'string') {
    return response.detail;
  }

  if (Array.isArray(response.detail)) {
    const errors = response.detail.map((err: ValidationErrorDetail) => {
      const field = err.loc && err.loc.length > 0 ? err.loc[err.loc.length - 1] : 'field';
      return `${field}: ${err.msg || 'Invalid value'}`;
    });
    return errors.join(', ');
  }

  if (typeof response.detail === 'object') {
    return JSON.stringify(response.detail);
  }

  return 'Validation error';
}
