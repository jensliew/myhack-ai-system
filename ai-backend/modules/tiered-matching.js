import { matchMentorsForStartup } from "./matching.js";
import {
  rankMentorsByPastCollaboration,
  buildCollaborationReasoning,
} from "../services/collaboration-matching.js";
import { getInterestedMentorIds } from "../services/interest-store.js";
import { calculateMatchScore } from "../services/matching.js";
import { formatMentorMatchCard } from "../services/match-presentation.js";

function mentorId(mentor) {
  return mentor?.id ?? mentor?.mentor_id;
}

function formatCollaborationCard(entry, startup) {
  const base = formatMentorMatchCard(
    {
      mentor: entry.mentor,
      score: entry.relevance_score,
      breakdown: [{ factor: "past_collaboration", points: entry.relevance_score }],
      ai_match_reasoning: buildCollaborationReasoning(entry, startup),
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

function formatInterestedCard(mentor, startup) {
  const { score, breakdown } = calculateMatchScore(startup, mentor);
  const base = formatMentorMatchCard(
    {
      mentor,
      score,
      breakdown,
      ai_match_reasoning: `${mentor.full_name ?? "This mentor"} expressed interest in joining your startup. Profile compatibility is ${score}%.`,
    },
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
  } = options;

  const usedIds = new Set();

  const collabRanked = rankMentorsByPastCollaboration(startup, mentors);
  const previous_collaborations = collabRanked.map((entry) => {
    usedIds.add(entry.mentor_id);
    return formatCollaborationCard(entry, startup);
  });

  const remainingForAi = mentors.filter((m) => !usedIds.has(mentorId(m)));
  const ai_suggested = tagTier2Cards(
    await matchMentorsForStartup(startup, remainingForAi, {
      limit,
      explainTop,
    })
  );
  ai_suggested.forEach((c) => usedIds.add(c.mentor_id));

  const interestedIds =
    interested_mentor_ids ??
    (startup_id ? getInterestedMentorIds(startup_id) : []);
  const interested = mentors
    .filter((m) => interestedIds.includes(mentorId(m)) && !usedIds.has(mentorId(m)))
    .map((m) => formatInterestedCard(m, startup));

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
    display_order: [
      "previous_collaborations",
      "ai_suggested",
      "interested",
    ],
  };
}
