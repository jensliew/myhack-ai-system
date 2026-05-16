import { callGemini } from "../services/gemini.js";
import { formatVerificationCard } from "../services/verification-presentation.js";
import { generateAdminVerificationText } from "./verification-reasoning.js";

export async function verifyStartup(startup) {
  const prompt = `
    You are an AI startup evaluator.

    Evaluate the startup using ONLY the given fields (limited form).

    Score each category 0–10:
    - idea_quality (based on problem + solution clarity)
    - market_potential (based on industry + looking_for)
    - stage_maturity (based on startup stage + team size)
    - execution_capability (based on team strength)
    - risk_level (higher = more risky startup)
    - ecosystem_fit (how well it fits a mentor-startup ecosystem)

    Also return:
    - confidence (0–10): how complete and clear the data is GIVEN THE LIMITED FORM FIELDS
    - missing_info (array): ONLY list CRITICAL missing info that should be asked in the form (e.g., founder experience, MVP status, revenue). Ignore nice-to-have details.

    Startup Data:
    ${JSON.stringify(startup, null, 2)}

    IMPORTANT:
    Return ONLY valid JSON. No markdown, no explanation.
`;

  const raw = await callGemini(prompt);
  const clean = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const ai = JSON.parse(clean);

  const score =
    ai.idea_quality +
    ai.market_potential +
    ai.stage_maturity +
    ai.execution_capability +
    ai.ecosystem_fit -
    ai.risk_level;

  let recommendation = "REJECT";

  if (score < 12) {
    recommendation = "REJECT";
  } else if (ai.missing_info && ai.missing_info.length > 5) {
    recommendation = "PENDING";
  } else if (ai.confidence < 6 && score < 35) {
    recommendation = "PENDING";
  } else if (score >= 38) {
    recommendation = "APPROVE";
  } else {
    recommendation = "PENDING";
  }

  let suggestions = null;
  if (recommendation === "PENDING") {
    const suggestionsPrompt = `
You are a startup mentor evaluator.

This startup received a PENDING status with the following:
- Scores: ${JSON.stringify(ai)}
- Missing Info: ${JSON.stringify(ai.missing_info)}
- Final Score: ${score}

Provide 3-5 SPECIFIC, ACTIONABLE improvement suggestions to help this startup move from PENDING to APPROVE.

Format as JSON array of objects:
{
  "priority": "High/Medium/Low",
  "suggestion": "What to do",
  "expected_impact": "How it helps approval"
}

Return ONLY valid JSON array. No markdown.
`;

    const suggestionsRaw = await callGemini(suggestionsPrompt);
    const suggestionsClean = suggestionsRaw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      suggestions = JSON.parse(suggestionsClean);
    } catch {
      suggestions = [];
    }
  }

  const adminText = await generateAdminVerificationText({
    role: "startup",
    profile: startup,
    recommendation,
    ai_scores: ai,
    final_score: score,
    missing_info: ai.missing_info,
  });

  return formatVerificationCard({
    role: "startup",
    profile: startup,
    recommendation,
    ai_scores: ai,
    final_score: score,
    confidence: ai.confidence,
    missing_info: ai.missing_info,
    improvement_suggestions: suggestions,
    ai_reasoning: adminText.ai_reasoning,
    industry_summary: adminText.industry_summary,
  });
}
