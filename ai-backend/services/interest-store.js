/**
 * Hackathon in-memory interest store.
 * Replace with your main app DB (Firebase / Supabase / Mongo) in production.
 *
 * Shape: { startupId: Set<mentorId> }
 */
const interestsByStartup = new Map();

export function addInterest({ mentor_id, startup_id }) {
  if (!mentor_id || !startup_id) {
    throw new Error("mentor_id and startup_id are required");
  }
  if (!interestsByStartup.has(startup_id)) {
    interestsByStartup.set(startup_id, new Set());
  }
  interestsByStartup.get(startup_id).add(mentor_id);
  return { mentor_id, startup_id, status: "interested" };
}

export function getInterestedMentorIds(startup_id) {
  const set = interestsByStartup.get(startup_id);
  return set ? [...set] : [];
}

export function getInterestedMentors(startup_id, allMentors) {
  const ids = new Set(getInterestedMentorIds(startup_id));
  return allMentors.filter((m) => ids.has(m.id ?? m.mentor_id));
}
