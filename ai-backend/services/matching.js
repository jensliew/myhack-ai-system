/** Normalize form values that may be string, array, or comma-separated. */
export function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim().toLowerCase()).filter(Boolean);
  }
  return String(value)
    .split(/[,;|]/)
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

function includesAny(haystack, needles) {
  if (!needles.length || !haystack.length) return false;
  return needles.some((needle) =>
    haystack.some(
      (item) => item.includes(needle) || needle.includes(item)
    )
  );
}

function parseExperienceYears(experience) {
  if (typeof experience === "number") return experience;
  const text = String(experience ?? "");
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function stageMentionedInBio(stage, bio) {
  if (!stage || !bio) return false;
  const stageText = String(stage).toLowerCase();
  const bioText = String(bio).toLowerCase();
  const keywords = [
    stageText,
    `${stageText} stage`,
    `${stageText}-stage`,
    `pre-${stageText}`,
    `early ${stageText}`,
  ];
  return keywords.some((k) => bioText.includes(k));
}

function locationMatch(a, b) {
  if (!a || !b) return false;
  const left = String(a).toLowerCase().trim();
  const right = String(b).toLowerCase().trim();
  if (left === right) return true;
  const leftParts = left.split(/[,\s]+/).filter(Boolean);
  const rightParts = right.split(/[,\s]+/).filter(Boolean);
  return leftParts.some((p) => rightParts.includes(p));
}

const UNAVAILABLE = ["not available", "unavailable", "none"];

export function isMentorAvailable(mentor) {
  const status = String(mentor?.availability ?? "").toLowerCase();
  return !UNAVAILABLE.some((u) => status.includes(u));
}

/**
 * Rule-based compatibility score (0–100). Same logic for startup→mentor and mentor→startup.
 */
export function calculateMatchScore(startup, mentor) {
  let score = 0;
  const breakdown = [];

  const industry = normalizeList(startup?.industry);
  const goals = normalizeList(startup?.goals);
  const expertise = normalizeList(mentor?.expertise);

  if (includesAny(expertise, industry)) {
    score += 30;
    breakdown.push({ factor: "industry_expertise", points: 30 });
  }

  if (includesAny(expertise, goals)) {
    score += 20;
    breakdown.push({ factor: "goals_expertise", points: 20 });
  }

  if (stageMentionedInBio(startup?.stage, mentor?.bio)) {
    score += 15;
    breakdown.push({ factor: "stage_bio", points: 15 });
  } else {
    const years = parseExperienceYears(mentor?.experience);
    if (years >= 3) {
      score += 15;
      breakdown.push({ factor: "experience_years", points: 15 });
    }
  }

  if (locationMatch(startup?.location, mentor?.location)) {
    score += 5;
    breakdown.push({ factor: "location", points: 5 });
  }

  const availability = String(mentor?.availability ?? "").toLowerCase();
  if (availability.includes("available") && !UNAVAILABLE.some((u) => availability.includes(u))) {
    score += 10;
    breakdown.push({ factor: "availability", points: 10 });
  }

  const funding = String(startup?.funding_stage ?? "").toLowerCase();
  if (
    funding &&
    includesAny(expertise, [
      "fundraising",
      "funding",
      "investor",
      "venture",
      "capital",
    ])
  ) {
    score += 10;
    breakdown.push({ factor: "funding_expertise", points: 10 });
  }

  return { score: Math.min(score, 100), breakdown };
}

export function rankMatches(startup, mentors, { limit = 10 } = {}) {
  const eligible = mentors.filter(isMentorAvailable);

  const ranked = eligible
    .map((mentor) => {
      const { score, breakdown } = calculateMatchScore(startup, mentor);
      return { mentor, score, breakdown };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked;
}

export function rankStartupMatches(mentor, startups, { limit = 10 } = {}) {
  if (!isMentorAvailable(mentor)) return [];

  const ranked = startups
    .map((startup) => {
      const { score, breakdown } = calculateMatchScore(startup, mentor);
      return { startup, score, breakdown };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked;
}
