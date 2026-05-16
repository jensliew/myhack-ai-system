import { callGemini } from "../services/gemini.js";

function parseJsonResponse(raw) {
  const clean = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  return JSON.parse(clean);
}

/**
 * Gemini explanation for a single startup–mentor pair (demo-friendly).
 */
export async function explainMatch(startup, mentor, { score, breakdown } = {}) {
  const prompt = `
You are a startup–mentor matching assistant.

Explain why this mentor is a good (or weak) match for this startup.
Use ONLY the profile data provided. Be concise and demo-friendly.

Startup:
${JSON.stringify(startup, null, 2)}

Mentor:
${JSON.stringify(mentor, null, 2)}

Rule-based score: ${score ?? "unknown"}
Score breakdown: ${JSON.stringify(breakdown ?? [])}

Return ONLY valid JSON with this shape:
{
  "reason": "one sentence summary",
  "ai_match_reasoning": "2-4 sentences for a UI card explaining fit, gaps, and relevance to the startup's goals and industry. Write in third person about the mentor.",
  "strengths": ["...", "..."],
  "weaknesses": ["..."],
  "suggestion": "one actionable next step"
}
No markdown.
`;

  try {
    const raw = await callGemini(prompt);
    return parseJsonResponse(raw);
  } catch {
    return {
      reason: "Could not generate AI explanation.",
      ai_match_reasoning:
        "AI reasoning is temporarily unavailable. Use the match percentage and expertise tags to decide.",
      strengths: [],
      weaknesses: [],
      suggestion: "Review profiles manually.",
    };
  }
}

export async function enrichTopMatches(
  startup,
  rankedMentors,
  { explainCount = 3 } = {}
) {
  const top = rankedMentors.slice(0, explainCount);
  const rest = rankedMentors.slice(explainCount);

  const enriched = await Promise.all(
    top.map(async (item) => {
      const explanation = await explainMatch(startup, item.mentor, {
        score: item.score,
        breakdown: item.breakdown,
      });
      return { ...item, ...explanation };
    })
  );

  return [...enriched, ...rest];
}

export async function enrichTopStartupMatches(
  mentor,
  rankedStartups,
  { explainCount = 3 } = {}
) {
  const top = rankedStartups.slice(0, explainCount);
  const rest = rankedStartups.slice(explainCount);

  const enriched = await Promise.all(
    top.map(async (item) => {
      const explanation = await explainMatch(item.startup, mentor, {
        score: item.score,
        breakdown: item.breakdown,
      });
      return { ...item, ...explanation };
    })
  );

  return [...enriched, ...rest];
}
