/**
 * AI model configuration for the Nexora platform.
 * Uses Gemini 3.1 Flash Lite as primary (150 RPM, 250K TPM quota).
 * Falls back to Gemma when Gemini is unavailable.
 */

/** Primary model for recommendations and verification */
export const GEMINI_MODEL = "gemini-3.1-flash-lite";

/** Fallback model when Gemini is unavailable */
export const GEMMA_MODEL = "gemma-4-31b-it";

/** Timeout for AI API calls in milliseconds */
export const AI_TIMEOUT_MS = 10_000;

/** Maximum number of mentor recommendations to generate per request */
export const MAX_RECOMMENDATIONS = 5;

/** Minimum compatibility score threshold to include in recommendations */
export const MIN_COMPATIBILITY_SCORE = 50;
