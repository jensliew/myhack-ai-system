import {
  buildIndustrySummary,
  buildFallbackReasoning,
} from "../services/verification-presentation.js";

/**
 * Admin UI paragraph + industry line (rule-based, no Gemini API calls)
 */
export async function generateAdminVerificationText({
  role,
  profile,
  recommendation,
  ai_scores,
  final_score,
  missing_info,
}) {
  // Use rule-based reasoning instead of Gemini
  return {
    ai_reasoning: buildFallbackReasoning(recommendation, missing_info, role),
    industry_summary: buildIndustrySummary(role, profile),
  };
}
