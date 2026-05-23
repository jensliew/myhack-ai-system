import { callGemini } from "../services/gemini.js";

/**
 * Generate AI-powered match reasoning using Gemini API.
 * Detailed, personalised reasoning referencing actual profile data.
 * Falls back to rule-based if API call fails.
 */
export async function explainMatch(startup, mentor, { score, breakdown, isMentorView = false } = {}) {
  const mentorName = mentor.name || mentor.full_name || "This mentor";
  const startupName = startup.name || startup.startup_name || "this startup";
  const mentorExpertise = Array.isArray(mentor.expertise) ? mentor.expertise : [];
  const startupGoals = Array.isArray(startup.goals) ? startup.goals : [];
  const startupIndustry = startup.industry || "";
  const startupStage = startup.stage || "";
  const mentorBio = mentor.bio || "";
  const mentorExperience = mentor.experience || "";
  const mentorIndustry = Array.isArray(mentor.industrySpecialization)
    ? mentor.industrySpecialization.join(", ")
    : mentor.industrySpecialization || "";
  const breakdownFactors = Array.isArray(breakdown)
    ? breakdown.map(b => b.factor.replace(/_/g, " ")).join(", ")
    : "";

  const prompt = isMentorView
    ? `You are an AI matching engine for a startup accelerator. Analyze this mentor-startup match and return a JSON object.

Mentor expertise: ${mentorExpertise.join(", ")}
Mentor industry specialization: ${mentorIndustry}
Mentor experience: ${mentorExperience}
Mentor bio: ${mentorBio}

Startup: ${startupName}
Startup industry: ${startupIndustry}
Startup stage: ${startupStage}
Startup goals: ${startupGoals.join(", ")}
Match score: ${score}%
Match factors: ${breakdownFactors}

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "ai_match_reasoning": "<2-3 sentences from the mentor's perspective explaining specifically why ${startupName} is a good match. Reference the startup's actual goals and how the mentor's specific expertise addresses them. Be personalised and specific, not generic.>",
  "strengths": ["<specific strength 1 referencing actual data>", "<specific strength 2>", "<specific strength 3>"],
  "suggestion": "<one actionable suggestion for the mentor on how to best support this startup based on their goals>"
}`
    : `You are an AI matching engine for a startup accelerator. Analyze this mentor-startup match and return a JSON object.

Startup: ${startupName}
Startup industry: ${startupIndustry}
Startup stage: ${startupStage}
Startup goals: ${startupGoals.join(", ")}

Mentor: ${mentorName}
Mentor expertise: ${mentorExpertise.join(", ")}
Mentor industry specialization: ${mentorIndustry}
Mentor experience: ${mentorExperience}
Mentor bio: ${mentorBio}
Match score: ${score}%
Match factors: ${breakdownFactors}

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "ai_match_reasoning": "<2-3 sentences from the startup's perspective explaining specifically why ${mentorName} is a good match. Reference the mentor's actual expertise and how it addresses the startup's specific goals. Be personalised and specific, not generic.>",
  "strengths": ["<specific strength 1 referencing actual data>", "<specific strength 2>", "<specific strength 3>"],
  "suggestion": "<one actionable suggestion for the startup on how to best leverage this mentor's expertise>"
}`;

  try {
    const raw = await callGemini(prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const result = JSON.parse(jsonMatch[0]);

    return {
      reason: `${score}% match`,
      ai_match_reasoning: result.ai_match_reasoning ?? "",
      strengths: result.strengths ?? mentorExpertise.slice(0, 3),
      weaknesses: [],
      suggestion: result.suggestion ?? null,
    };
  } catch (err) {
    console.error("Gemini match explanation failed, using fallback:", err.message);
    // Rule-based fallback
    const reasoning = isMentorView
      ? `${startupName} is focused on ${startupGoals[0] || startupIndustry}, which aligns with your expertise in ${mentorExpertise.slice(0, 2).join(", ")}.`
      : `${mentorName}'s expertise in ${mentorExpertise.slice(0, 2).join(", ")} directly addresses ${startupName}'s goals in ${startupIndustry}.`;
    return {
      reason: `${score}% match`,
      ai_match_reasoning: reasoning,
      strengths: mentorExpertise.slice(0, 3),
      weaknesses: [],
      suggestion: null,
    };
  }
}

// Top 3 only to conserve quota - sequential with delay to avoid 429
export async function enrichTopMatches(startup, rankedMentors, { explainCount = 3 } = {}) {
  const top = rankedMentors.slice(0, explainCount);
  const rest = rankedMentors.slice(explainCount);

  const enriched = [];
  for (const item of top) {
    const explanation = await explainMatch(startup, item.mentor, {
      score: item.score,
      breakdown: item.breakdown,
      isMentorView: false,
    });
    enriched.push({ ...item, ...explanation });
    // Small delay between calls to avoid 429 rate limit
    if (top.indexOf(item) < top.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return [...enriched, ...rest];
}

// Top 3 only to conserve quota - sequential with delay to avoid 429
export async function enrichTopStartupMatches(mentor, rankedStartups, { explainCount = 3 } = {}) {
  const top = rankedStartups.slice(0, explainCount);
  const rest = rankedStartups.slice(explainCount);

  const enriched = [];
  for (const item of top) {
    const explanation = await explainMatch(item.startup, mentor, {
      score: item.score,
      breakdown: item.breakdown,
      isMentorView: true,
    });
    enriched.push({ ...item, ...explanation });
    // Small delay between calls to avoid 429 rate limit
    if (top.indexOf(item) < top.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return [...enriched, ...rest];
}
