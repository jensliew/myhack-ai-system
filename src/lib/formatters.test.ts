import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { formatDate, formatScore, truncateText } from "./formatters";

describe("formatDate", () => {
  it("formats a valid Timestamp to a readable date", () => {
    // Jan 15, 2024 at midnight UTC
    const ts = Timestamp.fromDate(new Date("2024-01-15T00:00:00Z"));
    const result = formatDate(ts);
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  it("returns 'Invalid date' for null input", () => {
    expect(formatDate(null as unknown as Timestamp)).toBe("Invalid date");
  });

  it("returns 'Invalid date' for non-Timestamp objects", () => {
    expect(formatDate({} as unknown as Timestamp)).toBe("Invalid date");
  });
});

describe("formatScore", () => {
  it("formats a score as a percentage string", () => {
    expect(formatScore(92)).toBe("92%");
    expect(formatScore(0)).toBe("0%");
    expect(formatScore(100)).toBe("100%");
  });

  it("clamps scores above 100", () => {
    expect(formatScore(150)).toBe("100%");
  });

  it("clamps scores below 0", () => {
    expect(formatScore(-10)).toBe("0%");
  });

  it("rounds decimal scores", () => {
    expect(formatScore(85.7)).toBe("86%");
    expect(formatScore(85.3)).toBe("85%");
  });
});

describe("truncateText", () => {
  it("returns original text when within limit", () => {
    expect(truncateText("hello", 10)).toBe("hello");
  });

  it("truncates text exceeding the limit with ellipsis", () => {
    const result = truncateText("hello world", 5);
    expect(result).toBe("hello…");
    expect(result.length).toBe(6); // 5 chars + ellipsis
  });

  it("returns empty string for empty input", () => {
    expect(truncateText("", 10)).toBe("");
  });

  it("returns original text when length equals maxLength", () => {
    expect(truncateText("exact", 5)).toBe("exact");
  });
});
