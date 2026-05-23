import { callGemini } from "../services/gemini.js";

/**
 * Analyze monthly report to estimate project success / health using Gemini API.
 * Falls back to rule-based if API call fails.
 */
export async function analyzeMonthlyReport({
  content,
  startup_id,
  mentor_id,
  title,
  period,
}) {
  const prompt = `You are an AI analyst for a startup accelerator program. Analyze this monthly progress report and return a JSON object.

Report Title: ${title || "Monthly Progress Report"}
Period: ${period || "Not specified"}
Content:
${content || "No content provided"}

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "success_score": <number 0-100>,
  "project_health": "<at_risk|on_track|exceeding>",
  "milestones_met": ["<milestone1>", "<milestone2>"],
  "blockers": ["<blocker1>", "<blocker2>"],
  "kpis_summary": "<one sentence summarizing key metrics and KPIs>",
  "summary": "<2-sentence summary of the monthly report>"
}`;

  try {
    const raw = await callGemini(prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("Gemini monthly report analysis failed, using fallback:", err.message);
    // Rule-based fallback
    const contentLower = (content || "").toLowerCase();
    let successScore = 60;
    if (contentLower.includes("milestone") || contentLower.includes("achieved")) successScore += 15;
    if (contentLower.includes("growth") || contentLower.includes("increase")) successScore += 10;
    if (contentLower.includes("revenue") || contentLower.includes("users")) successScore += 10;
    if (contentLower.includes("launch") || contentLower.includes("release")) successScore += 10;
    if (contentLower.includes("delay") || contentLower.includes("delayed")) successScore -= 10;
    if (contentLower.includes("issue") || contentLower.includes("problem")) successScore -= 5;
    if (contentLower.includes("risk") || contentLower.includes("concern")) successScore -= 5;

    let projectHealth = "on_track";
    if (successScore >= 80) projectHealth = "exceeding";
    if (successScore <= 40) projectHealth = "at_risk";

    const milestones = contentLower.includes("milestone") || contentLower.includes("achieved")
      ? ["Key milestone achieved this period"] : ["Ongoing progress"];
    const blockers = contentLower.includes("delay") || contentLower.includes("blocked")
      ? ["Timeline delays encountered"] : ["None reported"];

    return {
      success_score: Math.min(Math.max(successScore, 0), 100),
      project_health: projectHealth,
      milestones_met: milestones,
      blockers: blockers,
      kpis_summary: "Project tracking key metrics and showing progress toward goals",
      summary: `Project is ${projectHealth === "exceeding" ? "exceeding" : projectHealth === "on_track" ? "on track with" : "facing challenges with"} its monthly objectives. Success score: ${Math.min(Math.max(successScore, 0), 100)}/100.`
    };
  }
}
