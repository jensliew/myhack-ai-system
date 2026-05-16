import { callGemini } from "../services/gemini.js";
import { formatVerificationCard } from "../services/verification-presentation.js";
import { generateAdminVerificationText } from "./verification-reasoning.js";

export async function verifyMentor(mentor) {
  const prompt = `
    You are an AI mentor evaluator for a startup mentorship program.

    Evaluate the mentor using ONLY the given fields (limited form).

    Score each category 0–10:
    - expertise_depth (breadth and depth of technical/business skills listed)
    - industry_specialization (relevance and clarity of industry focus)
    - mentoring_capability (inferred from experience and bio quality)
    - availability (commitment level - Full Time = 8+ hrs/week, Part Time = 3-8 hrs/week, Limited = <3 hrs/week)
    - communication_quality (clarity and professionalism of bio)
    - program_fit (how well they match mentor program goals)

    Also return:
    - confidence (0–10): how complete and clear the mentor profile is GIVEN THE LIMITED FORM FIELDS
    - missing_info (array): ONLY list CRITICAL missing info (e.g., mentoring background, success stories, specific industries served). Ignore nice-to-have details.

    Mentor Data:
    ${JSON.stringify(mentor, null, 2)}

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
    ai.expertise_depth +
    ai.industry_specialization +
    ai.mentoring_capability +
    ai.availability +
    ai.communication_quality +
    ai.program_fit;

  let recommendation = "REJECT";

  if (score < 18) {
    recommendation = "REJECT";
  } else if (ai.missing_info && ai.missing_info.length > 4) {
    recommendation = "PENDING";
  } else if (ai.confidence < 6 && score < 40) {
    recommendation = "PENDING";
  } else if (score >= 45) {
    recommendation = "APPROVE";
  } else {
    recommendation = "PENDING";
  }

  let suggestions = null;
  if (recommendation === "PENDING") {
    const suggestionsPrompt = `
You are a startup mentor program evaluator.

This mentor received a PENDING status with the following:
- Scores: ${JSON.stringify(ai)}
- Missing Info: ${JSON.stringify(ai.missing_info)}
- Final Score: ${score}

Provide 3-5 SPECIFIC, ACTIONABLE improvement suggestions to help this mentor move from PENDING to APPROVE.

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
    role: "mentor",
    profile: mentor,
    recommendation,
    ai_scores: ai,
    final_score: score,
    missing_info: ai.missing_info,
  });

  return formatVerificationCard({
    role: "mentor",
    profile: mentor,
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
