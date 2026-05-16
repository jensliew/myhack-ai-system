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
 * Analyze monthly report to estimate project success / health.
 */
export async function analyzeMonthlyReport({
  content,
  startup_id,
  mentor_id,
  title,
  period,
}) {
  const prompt = `
You analyze a startup's monthly mentorship report to judge project success and progress.

Startup ID: ${startup_id ?? "unknown"}
Mentor ID: ${mentor_id ?? "unknown"}
Title: ${title ?? "Monthly report"}
Period: ${period ?? "unspecified"}

Report content:
"""
${content}
"""

Return ONLY valid JSON:
{
  "success_score": 0-100,
  "project_health": "at_risk" | "on_track" | "exceeding",
  "milestones_met": ["milestone1"],
  "blockers": ["blocker1"],
  "kpis_summary": "brief KPI narrative",
  "summary": "2-3 sentences on overall project success for this period"
}
No markdown.
`;

  const raw = await callGemini(prompt);
  return parseJsonResponse(raw);
}
