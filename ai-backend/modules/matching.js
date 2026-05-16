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
