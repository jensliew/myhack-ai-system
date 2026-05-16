/**
 * Analyze monthly report to estimate project success / health (rule-based).
 */
export async function analyzeMonthlyReport({
  content,
  startup_id,
  mentor_id,
  title,
  period,
}) {
  // Rule-based analysis of monthly report
  const contentLower = (content || "").toLowerCase();
  
  // Calculate success score based on content analysis
  let successScore = 60; // baseline
  
  // Check for positive indicators
  if (contentLower.includes("milestone") || contentLower.includes("achieved")) successScore += 15;
  if (contentLower.includes("growth") || contentLower.includes("increase")) successScore += 10;
  if (contentLower.includes("revenue") || contentLower.includes("users")) successScore += 10;
  if (contentLower.includes("launch") || contentLower.includes("release")) successScore += 10;
  
  // Check for negative indicators
  if (contentLower.includes("delay") || contentLower.includes("delayed")) successScore -= 10;
  if (contentLower.includes("issue") || contentLower.includes("problem")) successScore -= 5;
  if (contentLower.includes("risk") || contentLower.includes("concern")) successScore -= 5;
  
  // Determine project health
  let projectHealth = "on_track";
  if (successScore >= 80) projectHealth = "exceeding";
  if (successScore <= 40) projectHealth = "at_risk";
  
  // Extract milestones and blockers
  const milestones = [];
  const blockers = [];
  
  if (contentLower.includes("milestone") || contentLower.includes("achieved")) {
    milestones.push("Key milestone achieved this period");
  }
  if (contentLower.includes("launch")) {
    milestones.push("Product/feature launch completed");
  }
  if (contentLower.includes("delay") || contentLower.includes("blocked")) {
    blockers.push("Timeline delays or blockers encountered");
  }
  if (contentLower.includes("resource") || contentLower.includes("team")) {
    blockers.push("Resource or team constraints");
  }
  
  return {
    success_score: Math.min(Math.max(successScore, 0), 100),
    project_health: projectHealth,
    milestones_met: milestones.length > 0 ? milestones : ["Ongoing progress"],
    blockers: blockers.length > 0 ? blockers : ["None reported"],
    kpis_summary: "Project tracking key metrics and showing progress toward goals",
    summary: `Project is ${projectHealth === "exceeding" ? "exceeding" : projectHealth === "on_track" ? "on track with" : "facing challenges with"} its monthly objectives. Success score: ${Math.min(Math.max(successScore, 0), 100)}/100.`
  };
}
