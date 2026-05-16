import type { UserRole } from "@/types";

/**
 * Validation error structure returned by validation functions.
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Maximum allowed file size in bytes (10 MB).
 */
export const MAX_FILE_SIZE_BYTES = 10_485_760;

/**
 * Minimum required password length.
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Validates registration input fields.
 * Returns an array of validation errors (empty if all inputs are valid).
 */
export function validateRegistrationInput(
  email: string,
  password: string,
  role: UserRole,
  entityId: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!email || !email.includes("@")) {
    errors.push({ field: "email", message: "A valid email is required." });
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    errors.push({
      field: "password",
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    });
  }

  if (!role || !["admin", "startup", "mentor"].includes(role)) {
    errors.push({ field: "role", message: "A valid role is required." });
  }

  if (!entityId || entityId.trim().length === 0) {
    errors.push({
      field: "entityId",
      message: "An entity ID is required.",
    });
  }

  return errors;
}

/**
 * Validates that a file size does not exceed the maximum allowed size (10 MB).
 * Returns a ValidationError if the file is too large, or null if valid.
 */
export function validateFileSize(sizeInBytes: number): ValidationError | null {
  if (sizeInBytes > MAX_FILE_SIZE_BYTES) {
    return {
      field: "file",
      message: `File size exceeds the maximum allowed size of 10 MB.`,
    };
  }
  return null;
}
