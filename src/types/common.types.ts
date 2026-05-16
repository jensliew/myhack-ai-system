/**
 * Common types shared across all services.
 */

/**
 * Standard result wrapper for all service calls.
 * Services return either data or an error, never both.
 */
export interface ServiceResult<T> {
  data: T | null;
  error: ServiceError | null;
}

/**
 * Structured error returned by service calls.
 */
export interface ServiceError {
  code: string;
  message: string;
  retryable: boolean;
}
