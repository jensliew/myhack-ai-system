/**
 * AI model configuration for the Nexora platform.
 * Uses Gemini API as primary with Gemma as offline fallback.
 */

/** Primary model for recommendations and verification */
export const GEMINI_MODEL = "gemini-2.5-flash";

/** Fallback model when Gemini is unavailable */
export const GEMMA_MODEL = "gemma-3-27b-it";

/** Timeout for AI API calls in milliseconds */
export const AI_TIMEOUT_MS = 10_000;

/** Maximum number of mentor recommendations to generate per request */
export const MAX_RECOMMENDATIONS = 5;

/** Minimum compatibility score threshold to include in recommendations */
export const MIN_COMPATIBILITY_SCORE = 50;
