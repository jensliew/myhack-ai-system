import { callGemini } from "../services/gemini.js";

/**
 * Generate AI-powered match reasoning using Gemini API.
 * Falls back to rule-based if API call fails.
 *
 * @param {Object} startup
 * @param {Object} mentor
 * @param {Object} options - { score, breakdown, isMentorView }
 */
export async function explainMatch(startup, mentor, { score, breakdown, isMentorView = false } = {}) {
  const mentorName = mentor.name || mentor.full_name || "This mentor";
  const startupName = startup.name || startup.startup_name || "this startup";
  const mentorExpertise = Array.isArray(mentor.expertise) ? mentor.expertise : [];
  const startupGoals = Array.isArray(startup.goals) ? startup.goals : [];
  const startupIndustry = startup.industry || "";
  const startupStage = startup.stage || "";

  const prompt = isMentorView
    ? `You are an AI matching engine for a startup accelerator. Explain in ONE concise sentence (max 20 words) why this startup is a good match for the mentor, from the mentor's perspective.

Mentor expertise: ${mentorExpertise.join(", ")}
Startup: ${startupName}
Startup industry: ${startupIndustry}
Startup stage: ${startupStage}
Startup goals: ${startupGoals.join(", ")}
Match score: ${score}%

Write ONE sentence starting with the startup name explaining why it matches the mentor's expertise. Be specific.`
    : `You are an AI matching engine for a startup accelerator. Explain in ONE concise sentence (max 20 words) why this mentor is a good match for the startup, from the startup's perspective.

Startup: ${startupName}
Startup industry: ${startupIndustry}
Startup goals: ${startupGoals.join(", ")}
Mentor: ${mentorName}
Mentor expertise: ${mentorExpertise.join(", ")}
Match score: ${score}%

Write ONE sentence starting with the mentor's name explaining why they match the startup's needs. Be specific.`;

  try {
    const reasoning = await callGemini(prompt);
    return {
      reason: `${score}% match`,
      ai_match_reasoning: reasoning.trim().replace(/^["']|["']$/g, ""),
      strengths: mentorExpertise.slice(0, 3),
      weaknesses: [],
      suggestion: null,
    };
  } catch (err) {
    console.error("Gemini match explanation failed, using fallback:", err.message);
    // Rule-based fallback
    const reasoning = isMentorView
      ? `${startupName} needs ${mentorExpertise[0] || "your expertise"} to achieve ${startupGoals[0] || "its goals"}.`
      : `${mentorName}'s expertise in ${mentorExpertise.slice(0, 2).join(", ")} matches ${startupName}'s ${startupIndustry} focus.`;
    return {
      reason: `${score}% match`,
      ai_match_reasoning: reasoning,
      strengths: mentorExpertise.slice(0, 3),
      weaknesses: [],
      suggestion: null,
    };
  }
}

export async function enrichTopMatches(startup, rankedMentors, { explainCount = 3 } = {}) {
  const top = rankedMentors.slice(0, explainCount);
  const rest = rankedMentors.slice(explainCount);

  const enriched = await Promise.all(
    top.map(async (item) => {
      const explanation = await explainMatch(startup, item.mentor, {
        score: item.score,
        breakdown: item.breakdown,
        isMentorView: false,
      });
      return { ...item, ...explanation };
    })
  );

  return [...enriched, ...rest];
}

export async function enrichTopStartupMatches(mentor, rankedStartups, { explainCount = 3 } = {}) {
  const top = rankedStartups.slice(0, explainCount);
  const rest = rankedStartups.slice(explainCount);

  const enriched = await Promise.all(
    top.map(async (item) => {
      const explanation = await explainMatch(item.startup, mentor, {
        score: item.score,
        breakdown: item.breakdown,
        isMentorView: true,
      });
      return { ...item, ...explanation };
    })
  );

  return [...enriched, ...rest];
}
