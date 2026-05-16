import { normalizeList } from "./matching.js";
import { getAllCollaborations } from "./collaboration-store.js";
import { isMentorAvailable } from "./matching.js";

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

export function buildCollaborationReasoning(entry, startup) {
  const c = entry.collaboration;
  const parts = [];
  if (c.startup_name) {
    parts.push(`Previously mentored ${c.startup_name}`);
  } else {
    parts.push("Has prior mentorship collaboration on the platform");
  }
  if (entry.industry_match && startup?.industry) {
    parts.push(`relevant ${startup.industry} experience`);
  }
  if (c.avg_success != null) {
    parts.push(`${c.avg_success}% average project success from monthly reports`);
  }
  if (c.avg_engagement != null) {
    parts.push(`${c.avg_engagement}% engagement from meeting minutes`);
  }
  return `${parts.join(". ")}. Recommended because of proven track record before AI profile matching.`;
}
