import { callGemini } from "../services/gemini.js";
import {
  buildIndustrySummary,
  buildFallbackReasoning,
} from "../services/verification-presentation.js";

function parseJsonResponse(raw) {
  const clean = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  return JSON.parse(clean);
}

/**
 * Admin UI paragraph + industry line (matches Nexora verification cards).
 */
export async function generateAdminVerificationText({
  role,
  profile,
  recommendation,
  ai_scores,
  final_score,
  missing_info,
}) {
  const prompt = `
You are an admin reviewer for a startup–mentor platform.

Write copy for the admin registration review card.

Role: ${role}
AI decision code: ${recommendation} (APPROVE | PENDING | REJECT)
Final score: ${final_score}
Confidence: ${ai_scores?.confidence ?? "unknown"}
Category scores: ${JSON.stringify(ai_scores ?? {})}
Missing or weak areas: ${JSON.stringify(missing_info ?? [])}

Applicant profile:
${JSON.stringify(profile, null, 2)}

Return ONLY valid JSON:
{
  "ai_reasoning": "2-5 sentences for the grey box. Explain what is present, what is missing, contradictions, placeholder text, missing documents, etc. Match a professional admin review tone.",
  "industry_summary": "One line starting with 'Industry:' e.g. 'Industry: FinTech (based on experience), SaaS (specialization).'"
}
No markdown.
`;

  try {
    const raw = await callGemini(prompt);
    return parseJsonResponse(raw);
  } catch {
    return {
      ai_reasoning: buildFallbackReasoning(recommendation, missing_info, role),
      industry_summary: buildIndustrySummary(role, profile),
    };
  }
}
