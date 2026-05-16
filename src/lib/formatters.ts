import { Timestamp } from "firebase/firestore";

/**
 * Formats a Firebase Timestamp to a human-readable date string.
 * Returns "Invalid date" if the input is not a valid Timestamp.
 */
export function formatDate(timestamp: Timestamp): string {
  if (!timestamp || typeof timestamp.toDate !== "function") {
    return "Invalid date";
  }

  const date = timestamp.toDate();
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Formats a compatibility score (0-100) as a percentage string.
 * Clamps the value between 0 and 100.
 */
export function formatScore(score: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return `${clamped}%`;
}

/**
 * Truncates text to a maximum length, appending an ellipsis if truncated.
 * Returns the original text if it is within the limit.
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) {
    return "";
  }
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + "…";
}
