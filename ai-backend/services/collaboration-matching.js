import { normalizeList } from "./matching.js";
import { getAllCollaborations } from "./collaboration-store.js";
import { isMentorAvailable } from "./matching.js";
import { callGemini } from "../services/gemini.js";

function industryOverlap(startupIndustry, collabIndustry) {
  const a = normalizeList(startupIndustry);
  const b = normalizeList(collabIndustry);
  if (!a.length || !b.length) return 0;
  return a.some((x) =>
    b.some((y) => x.includes(y) || y.includes(x))
  )
    ? 1
    : 0;
}

/**
 * Mentors with proven past collaborations, ranked for a NEW startup.
 * Prioritises same industry + high success + strong engagement.
 */
export function rankMentorsByPastCollaboration(startup, mentors) {
  const pool = mentors.filter(isMentorAvailable);
  const poolIds = new Set(pool.map((m) => m.id ?? m.mentor_id));
  const byMentor = new Map();

  for (const collab of getAllCollaborations()) {
    if (!poolIds.has(collab.mentor_id)) continue;
    if ((collab.collaboration_score ?? 0) <= 0) continue;

    const industryMatch = industryOverlap(startup.industry, collab.industry);
    const relevanceScore = Math.round(
      (collab.collaboration_score ?? 0) * 0.6 +
        (collab.avg_success ?? 0) * 0.25 * industryMatch +
        (collab.avg_engagement ?? 0) * 0.15 * industryMatch +
        industryMatch * 15
    );

    const existing = byMentor.get(collab.mentor_id);
    if (!existing || relevanceScore > existing.relevance_score) {
      byMentor.set(collab.mentor_id, {
        mentor_id: collab.mentor_id,
        relevance_score: Math.min(relevanceScore, 100),
        collaboration: collab,
        industry_match: Boolean(industryMatch),
      });
    }
  }

  return [...byMentor.values()]
    .map((entry) => {
      const mentor = pool.find(
        (m) => (m.id ?? m.mentor_id) === entry.mentor_id
      );
      return { mentor, ...entry };
    })
    .filter((e) => e.mentor)
    .sort((a, b) => b.relevance_score - a.relevance_score);
}

/**
 * Generate AI-powered collaboration reasoning using Gemini API.
 * Falls back to rule-based if API call fails.
 */
export async function buildCollaborationReasoning(entry, startup) {
  const c = entry.collaboration;
  const mentorName = entry.mentor?.name || entry.mentor?.full_name || "This mentor";
  const startupName = startup?.name || startup?.startup_name || "your startup";
  const mentorExpertise = Array.isArray(entry.mentor?.expertise)
    ? entry.mentor.expertise.join(", ")
    : entry.mentor?.expertise || "";

  const prompt = `You are an AI matching engine for a startup accelerator. Analyze this previous collaboration and explain why this mentor is recommended for the new startup.

Mentor: ${mentorName}
Mentor expertise: ${mentorExpertise}
Previously mentored: ${c.startup_name || "a startup"}
Past industry: ${c.industry || "Not specified"}
Past engagement score: ${c.avg_engagement ?? "N/A"}%
Past success rate: ${c.avg_success ?? "N/A"}%
Collaboration score: ${c.collaboration_score ?? "N/A"}
Industry match with new startup: ${entry.industry_match ? "Yes" : "No"}

New Startup: ${startupName}
New Startup industry: ${startup?.industry || "Not specified"}
New Startup goals: ${Array.isArray(startup?.goals) ? startup.goals.join(", ") : startup?.goals || "Not specified"}
Relevance score: ${entry.relevance_score}%

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "ai_match_reasoning": "<2-3 sentences explaining why ${mentorName} is recommended based on their proven track record. Reference their actual past performance metrics and how it relates to ${startupName}'s specific needs. Be specific and personalised.>",
  "strengths": ["<specific strength from collaboration data>", "<specific strength 2>", "<specific strength 3>"],
  "suggestion": "<one actionable suggestion for how ${startupName} can best leverage ${mentorName}'s proven experience>"
}`;

  try {
    const raw = await callGemini(prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const result = JSON.parse(jsonMatch[0]);
    return {
      ai_match_reasoning: result.ai_match_reasoning ?? "",
      strengths: result.strengths ?? [],
      suggestion: result.suggestion ?? null,
    };
  } catch (err) {
    console.error("Gemini collaboration reasoning failed, using fallback:", err.message);
    // Rule-based fallback
    const parts = [];
    if (c.startup_name) parts.push(`Previously mentored ${c.startup_name}`);
    else parts.push("Has prior mentorship collaboration on the platform");
    if (entry.industry_match && startup?.industry) parts.push(`relevant ${startup.industry} experience`);
    if (c.avg_success != null) parts.push(`${c.avg_success}% average project success`);
    if (c.avg_engagement != null) parts.push(`${c.avg_engagement}% engagement from meeting minutes`);
    return {
      ai_match_reasoning: `${parts.join(". ")}. Recommended because of proven track record before AI profile matching.`,
      strengths: [],
      suggestion: null,
    };
  }
}
