import { describe, it, expect } from "vitest";
import {
  validateRegistrationInput,
  validateFileSize,
  MAX_FILE_SIZE_BYTES,
} from "./validators";

describe("validateRegistrationInput", () => {
  it("returns no errors for valid input", () => {
    const errors = validateRegistrationInput(
      "user@example.com",
      "password123",
      "startup",
      "entity-abc"
    );
    expect(errors).toHaveLength(0);
  });

  it("returns error when password is shorter than 8 characters", () => {
    const errors = validateRegistrationInput(
      "user@example.com",
      "short",
      "mentor",
      "entity-abc"
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe("password");
  });

  it("returns error when entityId is empty", () => {
    const errors = validateRegistrationInput(
      "user@example.com",
      "password123",
      "startup",
      ""
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe("entityId");
  });

  it("returns error when entityId is only whitespace", () => {
    const errors = validateRegistrationInput(
      "user@example.com",
      "password123",
      "startup",
      "   "
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe("entityId");
  });

  it("returns multiple errors for multiple invalid fields", () => {
    const errors = validateRegistrationInput("bad-email", "short", "startup", "");
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe("validateFileSize", () => {
  it("returns null for files within the size limit", () => {
    expect(validateFileSize(0)).toBeNull();
    expect(validateFileSize(5_000_000)).toBeNull();
    expect(validateFileSize(MAX_FILE_SIZE_BYTES)).toBeNull();
  });

  it("returns error for files exceeding the size limit", () => {
    const error = validateFileSize(MAX_FILE_SIZE_BYTES + 1);
    expect(error).not.toBeNull();
    expect(error!.field).toBe("file");
  });

  it("returns null for exactly 10 MB", () => {
    expect(validateFileSize(10_485_760)).toBeNull();
  });

  it("returns error for 10 MB + 1 byte", () => {
    const error = validateFileSize(10_485_761);
    expect(error).not.toBeNull();
  });
});
