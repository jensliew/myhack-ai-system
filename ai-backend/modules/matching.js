import {
  rankMatches,
  rankStartupMatches,
} from "../services/matching.js";
import {
  enrichTopMatches,
  enrichTopStartupMatches,
} from "./match-explanation.js";
import {
  formatMentorMatchList,
  formatStartupMatchList,
} from "../services/match-presentation.js";

export async function matchMentorsForStartup(startup, mentors, options = {}) {
  const { limit = 10, explainTop = 3, format = true } = options;
  const ranked = rankMatches(startup, mentors, { limit });
  const withExplanation =
    explainTop > 0
      ? await enrichTopMatches(startup, ranked, { explainCount: explainTop })
      : ranked;
  if (!format) return withExplanation;
  return formatMentorMatchList(withExplanation, startup);
}

export async function matchStartupsForMentor(mentor, startups, options = {}) {
  const { limit = 10, explainTop = 3, format = true } = options;
  const ranked = rankStartupMatches(mentor, startups, { limit });
  const withExplanation =
    explainTop > 0
      ? await enrichTopStartupMatches(mentor, ranked, {
          explainCount: explainTop,
        })
      : ranked;
  if (!format) return withExplanation;
  return formatStartupMatchList(withExplanation, mentor);
}

/**
 * Tiered startup recommendations for mentor
 * 1) Previous collaborations  2) AI suggested  3) Expressed interest
 */
export async function getTieredStartupRecommendations(
  mentor,
  startups,
  options = {}
) {
  const {
    mentor_id = mentor?.id ?? mentor?.mentor_id,
    limit = 10,
    explainTop = 3,
    interested_startup_ids = [],
  } = options;

  const usedIds = new Set();

  // For now, no previous collaborations (would need collaboration history)
  const previous_collaborations = [];

  // AI suggested startups
  const remainingForAi = startups.filter((s) => !usedIds.has(s.id ?? s.startup_id));
  const ai_suggested = await matchStartupsForMentor(mentor, remainingForAi, {
    limit,
    explainTop,
  });
  ai_suggested.forEach((c) => usedIds.add(c.startup_id));

  // Expressed interest
  const interested = startups
    .filter((s) => interested_startup_ids.includes(s.id ?? s.startup_id) && !usedIds.has(s.id ?? s.startup_id))
    .map((s) => {
      const { score } = rankStartupMatches(mentor, [s], { limit: 1 })[0] || { score: 50 };
      return {
        startup_id: s.id ?? s.startup_id,
        startup_name: s.name,
        industry: s.industry,
        stage: s.stage,
        match_percentage: score,
        match_label: `${score}%`,
        recommendation_tier: 3,
        tier_label: "Expressed Interest",
        tier_order: 3,
        reasoning: `You expressed interest in ${s.name}. Review their profile to confirm fit.`,
      };
    });

  return {
    mentor_id: mentor_id ?? null,
    previous_collaborations,
    ai_suggested,
    interested,
    all_ordered: [...previous_collaborations, ...ai_suggested, ...interested],
    display_order: ["previous_collaborations", "ai_suggested", "interested"],
  };
}
