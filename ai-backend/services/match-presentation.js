/** Display expertise as title-case tags for UI pills. */
export function formatExpertiseTags(expertise) {
  const list = Array.isArray(expertise)
    ? expertise
    : String(expertise ?? "")
        .split(/[,;|]/)
        .map((s) => s.trim())
        .filter(Boolean);

  return list.map((tag) =>
    tag
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")
  );
}

function primaryField(mentor) {
  const tags = formatExpertiseTags(mentor?.expertise);
  if (tags.length) return tags[0];
  const exp = String(mentor?.experience ?? "").trim();
  if (exp) return exp.slice(0, 40);
  return mentor?.company ?? mentor?.current_role ?? "Mentor";
}

function buildFallbackReasoning(score, breakdown, mentor, startup) {
  if (!breakdown?.length) {
    return `${mentor?.full_name ?? "This mentor"} has a ${score}% compatibility score with ${startup?.startup_name ?? "your startup"} based on profile overlap.`;
  }
  const parts = breakdown.map((b) => b.factor.replace(/_/g, " "));
  return `Match score ${score}% driven by ${parts.join(", ")}. Review full profiles to confirm fit for ${startup?.startup_name ?? "your startup"}.`;
}

/**
 * Shape returned to Nexora "AI Suggested Mentors" cards.
 */
export function formatMentorMatchCard(item, startup) {
  const mentor = item.mentor ?? item;
  const score = item.score ?? 0;
  const tags = formatExpertiseTags(mentor.expertise);

  const aiReasoning =
    item.ai_match_reasoning ??
    item.reason ??
    buildFallbackReasoning(score, item.breakdown, mentor, startup);

  return {
    mentor_id: mentor.id ?? mentor.mentor_id,
    full_name: mentor.full_name ?? mentor.name ?? "Mentor",
    match_percentage: score,
    match_label: `${score}%`,
    recommendation_tier: item.recommendation_tier ?? 2,
    tier_label: item.tier_label ?? "AI Suggested",
    tier_order: item.tier_order ?? 2,
    expertise_tags: tags,
    ai_match_reasoning: aiReasoning,
    reason: item.reason ?? null,
    strengths: item.strengths ?? [],
    weaknesses: item.weaknesses ?? [],
    suggestion: item.suggestion ?? null,
    company_or_field: primaryField(mentor),
    availability: mentor.availability ?? "—",
    location: mentor.location ?? "—",
    experience: mentor.experience ?? null,
    bio: mentor.bio ?? null,
    success_rate: mentor.success_rate ?? null,
    mentorship_count: mentor.mentorship_count ?? mentor.mentorships ?? null,
    score,
    breakdown: item.breakdown ?? [],
    mentor,
  };
}

export function formatStartupMatchCard(item, mentor) {
  const startup = item.startup ?? item;
  const score = item.score ?? 0;
  const tags = formatExpertiseTags(startup.industry);

  const aiReasoning =
    item.ai_match_reasoning ??
    item.reason ??
    buildFallbackReasoning(score, item.breakdown, mentor, startup);

  return {
    startup_id: startup.id ?? startup.startup_id,
    startup_name: startup.startup_name ?? startup.name ?? "Startup",
    match_percentage: score,
    match_label: `${score}%`,
    industry_tags: tags.length ? tags : formatExpertiseTags(startup.goals),
    ai_match_reasoning: aiReasoning,
    reason: item.reason ?? null,
    stage: startup.stage ?? null,
    team_size: startup.team_size ?? null,
    location: startup.location ?? "—",
    funding_stage: startup.funding_stage ?? null,
    goals: startup.goals ?? [],
    score,
    breakdown: item.breakdown ?? [],
    startup,
  };
}

export function formatMentorMatchList(matches, startup) {
  return matches.map((m) => formatMentorMatchCard(m, startup));
}

export function formatStartupMatchList(matches, mentor) {
  return matches.map((m) => formatStartupMatchCard(m, mentor));
}
