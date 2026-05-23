import { matchMentorsForStartup } from "./matching.js";
import {
  rankMentorsByPastCollaboration,
  buildCollaborationReasoning,
} from "../services/collaboration-matching.js";
import { getInterestedMentorIds } from "../services/interest-store.js";
import { calculateMatchScore } from "../services/matching.js";
import { formatMentorMatchCard } from "../services/match-presentation.js";
import { callGemini } from "../services/gemini.js";

function mentorId(mentor) {
  return mentor?.id ?? mentor?.mentor_id;
}

async function formatCollaborationCard(entry, startup) {
  const collabReasoning = await buildCollaborationReasoning(entry, startup);
  const base = formatMentorMatchCard(
    {
      mentor: entry.mentor,
      score: entry.relevance_score,
      breakdown: [{ factor: "past_collaboration", points: entry.relevance_score }],
      ai_match_reasoning: collabReasoning.ai_match_reasoning,
      strengths: collabReasoning.strengths,
      suggestion: collabReasoning.suggestion,
    },
    startup
  );

  const c = entry.collaboration;
  return {
    ...base,
    match_percentage: entry.relevance_score,
    match_label: `${entry.relevance_score}%`,
    recommendation_tier: 1,
    tier_label: "Previous Collaboration",
    tier_order: 1,
    success_rate: c.avg_success ?? base.success_rate,
    mentorship_count:
      (c.meeting_minutes_count ?? 0) + (c.monthly_reports_count ?? 0),
    collaboration_stats: {
      past_startup_name: c.startup_name,
      past_industry: c.industry,
      avg_engagement: c.avg_engagement,
      avg_success: c.avg_success,
      collaboration_score: c.collaboration_score,
      industry_match: entry.industry_match,
    },
  };
}

async function formatInterestedCard(mentor, startup) {
  const { score, breakdown } = calculateMatchScore(startup, mentor);
  const mentorName = mentor.full_name ?? mentor.name ?? "This mentor";
  const startupName = startup?.name || startup?.startup_name || "your startup";
  const mentorExpertise = Array.isArray(mentor.expertise)
    ? mentor.expertise.join(", ")
    : mentor.expertise || "";

  const prompt = `You are an AI matching engine for a startup accelerator. This mentor has expressed interest in the startup. Write a personalised reasoning.

Mentor: ${mentorName}
Mentor expertise: ${mentorExpertise}
Startup: ${startupName}
Startup industry: ${startup?.industry || "Not specified"}
Startup goals: ${Array.isArray(startup?.goals) ? startup.goals.join(", ") : startup?.goals || "Not specified"}
Profile compatibility score: ${score}%

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "ai_match_reasoning": "<2 sentences explaining why this mentor's interest in ${startupName} makes sense based on their expertise and the startup's needs. Be specific and personalised.>",
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "suggestion": "<one actionable next step for the startup to evaluate this mentor's fit>"
}`;

  let ai_match_reasoning = `${mentorName} expressed interest in joining ${startupName}. Profile compatibility is ${score}%.`;
  let strengths = [];
  let suggestion = null;

  try {
    const raw = await callGemini(prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      ai_match_reasoning = result.ai_match_reasoning ?? ai_match_reasoning;
      strengths = result.strengths ?? [];
      suggestion = result.suggestion ?? null;
    }
  } catch (err) {
    console.error("Gemini interested card reasoning failed, using fallback:", err.message);
  }

  const base = formatMentorMatchCard(
    { mentor, score, breakdown, ai_match_reasoning, strengths, suggestion },
    startup
  );
  return {
    ...base,
    recommendation_tier: 3,
    tier_label: "Expressed Interest",
    tier_order: 3,
  };
}

function tagTier2Cards(cards) {
  return cards.map((card) => ({
    ...card,
    recommendation_tier: 2,
    tier_label: "AI Suggested",
    tier_order: 2,
  }));
}

/**
 * Startup mentor discovery — display order:
 * 1) Previous collaborations  2) AI suggested  3) Interested mentors
 * 
 * Active mentors are excluded from previous collaborations to prevent duplicates.
 */
export async function getTieredMentorRecommendations(
  startup,
  mentors,
  options = {}
) {
  const {
    startup_id = startup?.id ?? startup?.startup_id,
    limit = 10,
    explainTop = 3,
    interested_mentor_ids = null,
    active_mentor_ids = [],
  } = options;

  // Build a set of ALL mentor IDs to exclude (active relationships)
  const activeMentorIdSet = new Set(active_mentor_ids || []);

  // usedIds tracks mentors already placed in a tier to avoid duplicates
  const usedIds = new Set();
  // Pre-populate with active mentor IDs so they are excluded from ALL tiers
  activeMentorIdSet.forEach((id) => usedIds.add(id));

  // Filter the mentor list upfront - remove any active mentors before processing
  const eligibleMentors = mentors.filter((m) => !activeMentorIdSet.has(mentorId(m)));

  const collabRanked = rankMentorsByPastCollaboration(startup, eligibleMentors);

  // Previous collaborations - sequential with delay to avoid 429 quota errors
  const previous_collaborations = [];
  for (const entry of collabRanked) {
    if (usedIds.has(entry.mentor_id)) continue;
    usedIds.add(entry.mentor_id);
    const card = await formatCollaborationCard(entry, startup);
    previous_collaborations.push(card);
    // Small delay between Gemini calls
    if (collabRanked.indexOf(entry) < collabRanked.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // AI suggested - only from eligible mentors not already used
  const remainingForAi = eligibleMentors.filter((m) => !usedIds.has(mentorId(m)));
  const ai_suggested = tagTier2Cards(
    await matchMentorsForStartup(startup, remainingForAi, {
      limit,
      explainTop,
    })
  );
  ai_suggested.forEach((c) => usedIds.add(c.mentor_id));

  // Interested mentors - exclude active and already-used
  const interestedIds =
    interested_mentor_ids ??
    (startup_id ? getInterestedMentorIds(startup_id) : []);

  const interested = [];
  for (const m of eligibleMentors) {
    const mid = mentorId(m);
    if (!interestedIds.includes(mid) || usedIds.has(mid)) continue;
    usedIds.add(mid);
    const card = await formatInterestedCard(m, startup);
    interested.push(card);
  }

  const all_ordered = [
    ...previous_collaborations,
    ...ai_suggested,
    ...interested,
  ];

  return {
    startup_id: startup_id ?? null,
    previous_collaborations,
    ai_suggested,
    interested,
    all_ordered,
    display_order: ["previous_collaborations", "ai_suggested", "interested"],
  };
}
