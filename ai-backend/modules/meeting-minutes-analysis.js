import { callGemini } from "../services/gemini.js";

function parseJsonResponse(raw) {
  return JSON.parse(
    raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim()
  );
}

/**
 * Analyze mentor–startup engagement from meeting minutes text.
 */
export async function analyzeMeetingMinutes({
  content,
  startup_id,
  mentor_id,
  title,
  period,
}) {
  const prompt = `
You analyze mentorship meeting minutes to score engagement and interaction quality.

Startup ID: ${startup_id ?? "unknown"}
Mentor ID: ${mentor_id ?? "unknown"}
Title: ${title ?? "Meeting"}
Period: ${period ?? "unspecified"}

Meeting minutes:
"""
${content}
"""

Return ONLY valid JSON:
{
  "engagement_score": 0-100,
  "interaction_quality": "low" | "medium" | "high",
  "mentor_participation": "brief assessment",
  "startup_engagement": "brief assessment",
  "key_topics": ["topic1", "topic2"],
  "action_items": ["item1"],
  "summary": "2-3 sentences for admin/startup dashboard"
}
No markdown.
`;

  const raw = await callGemini(prompt);
  return parseJsonResponse(raw);
}
