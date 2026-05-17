import { callGemini } from "../services/gemini.js";
import {
  buildIndustrySummary,
  buildFallbackReasoning,
} from "../services/verification-presentation.js";

/**
 * Generate admin verification reasoning using Gemini API.
 * Falls back to rule-based if API call fails.
 */
export async function generateAdminVerificationText({
  role,
  profile,
  recommendation,
  ai_scores,
  final_score,
  missing_info,
}) {
  const name = profile.name || profile.full_name || profile.startup_name || "Applicant";
  const missingList = missing_info?.length > 0
    ? `Missing: ${missing_info.join(", ")}.`
    : "All key fields are present.";

  const scoresText = Object.entries(ai_scores || {})
    .filter(([k]) => k !== "confidence")
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}/10`)
    .join(", ");

  const prompt = role === "startup"
    ? `You are an AI evaluator for a startup accelerator program. Analyze this startup application and write a concise 2-sentence assessment for the admin.

Startup: ${name}
Industry: ${profile.industry || "Not specified"}
Stage: ${profile.stage || "Not specified"}
Team Size: ${profile.teamSize || profile.team_size || "Not specified"}
Description: ${profile.description || "Not provided"}
Goals: ${Array.isArray(profile.goals) ? profile.goals.join(", ") : profile.goals || "Not specified"}
AI Scores: ${scoresText}
Final Score: ${final_score}
Recommendation: ${recommendation}
${missingList}

Write a 2-sentence admin assessment explaining the recommendation. Be specific about strengths and what needs improvement. Do not use bullet points.`
    : `You are an AI evaluator for a startup accelerator mentorship program. Analyze this mentor application and write a concise 2-sentence assessment for the admin.

Mentor: ${name}
Expertise: ${Array.isArray(profile.expertise) ? profile.expertise.join(", ") : profile.expertise || "Not specified"}
Industry Specialization: ${Array.isArray(profile.industrySpecialization) ? profile.industrySpecialization.join(", ") : profile.industrySpecialization || "Not specified"}
Experience: ${profile.experience || "Not specified"}
Availability: ${profile.availability || "Not specified"}
Bio: ${profile.bio || "Not provided"}
AI Scores: ${scoresText}
Final Score: ${final_score}
Recommendation: ${recommendation}
${missingList}

Write a 2-sentence admin assessment explaining the recommendation. Be specific about strengths and what needs improvement. Do not use bullet points.`;

  try {
    const ai_reasoning = await callGemini(prompt);
    return {
      ai_reasoning: ai_reasoning.trim(),
      industry_summary: buildIndustrySummary(role, profile),
    };
  } catch (err) {
    console.error("Gemini verification reasoning failed, using fallback:", err.message);
    return {
      ai_reasoning: buildFallbackReasoning(recommendation, missing_info, role),
      industry_summary: buildIndustrySummary(role, profile),
    };
  }
}
