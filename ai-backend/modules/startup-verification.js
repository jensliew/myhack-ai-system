import { formatVerificationCard } from "../services/verification-presentation.js";
import { generateAdminVerificationText } from "./verification-reasoning.js";

export async function verifyStartup(startup) {
  // Rule-based startup evaluation (no Gemini API calls)
  
  // Score each category 0-10 based on available data
  let idea_quality = 5;
  if (startup.description && startup.description.length > 50) idea_quality += 3;
  if (startup.goals && startup.goals.length > 0) idea_quality += 2;
  
  let market_potential = 5;
  if (startup.industry) market_potential += 2;
  if (startup.goals && startup.goals.includes("Scale") || startup.goals.includes("Expand")) market_potential += 3;
  
  let stage_maturity = 5;
  if (startup.stage === "seed" || startup.stage === "series-a") stage_maturity += 3;
  if (startup.teamSize && startup.teamSize >= 5) stage_maturity += 2;
  
  let execution_capability = 5;
  if (startup.teamSize && startup.teamSize >= 3) execution_capability += 3;
  if (startup.website) execution_capability += 2;
  
  let risk_level = 3;
  if (startup.stage === "idea") risk_level += 3;
  if (!startup.description || startup.description.length < 20) risk_level += 2;
  
  let ecosystem_fit = 6;
  if (startup.industry && ["FinTech", "HealthTech", "EdTech", "SaaS"].includes(startup.industry)) ecosystem_fit += 2;
  
  // Calculate confidence based on data completeness
  let confidence = 5;
  if (startup.name) confidence += 1;
  if (startup.description) confidence += 1;
  if (startup.industry) confidence += 1;
  if (startup.teamSize) confidence += 1;
  if (startup.goals && startup.goals.length > 0) confidence += 1;
  
  // Identify missing info
  const missing_info = [];
  if (!startup.description || startup.description.length < 50) missing_info.push("Detailed business description");
  if (!startup.teamSize) missing_info.push("Team size information");
  if (!startup.website) missing_info.push("Website or online presence");
  if (!startup.goals || startup.goals.length === 0) missing_info.push("Clear business goals");
  
  const score =
    idea_quality +
    market_potential +
    stage_maturity +
    execution_capability +
    ecosystem_fit -
    risk_level;

  let recommendation = "REJECT";
  if (score < 12) {
    recommendation = "REJECT";
  } else if (missing_info.length > 3) {
    recommendation = "PENDING";
  } else if (confidence < 6 && score < 35) {
    recommendation = "PENDING";
  } else if (score >= 38) {
    recommendation = "APPROVE";
  } else {
    recommendation = "PENDING";
  }

  let suggestions = null;
  if (recommendation === "PENDING") {
    suggestions = [
      {
        priority: "High",
        suggestion: "Provide a detailed business description explaining the problem and solution",
        expected_impact: "Helps mentors understand your vision and provide better guidance"
      },
      {
        priority: "High",
        suggestion: "Clearly define your team size and key roles",
        expected_impact: "Demonstrates execution capability and organizational structure"
      },
      {
        priority: "Medium",
        suggestion: "Set specific, measurable business goals",
        expected_impact: "Shows strategic thinking and helps match with relevant mentors"
      }
    ];
  }

  const ai = {
    idea_quality,
    market_potential,
    stage_maturity,
    execution_capability,
    risk_level,
    ecosystem_fit,
    confidence
  };

  const adminText = await generateAdminVerificationText({
    role: "startup",
    profile: startup,
    recommendation,
    ai_scores: ai,
    final_score: score,
    missing_info,
  });

  return formatVerificationCard({
    role: "startup",
    profile: startup,
    recommendation,
    ai_scores: ai,
    final_score: score,
    confidence,
    missing_info,
    improvement_suggestions: suggestions,
    ai_reasoning: adminText.ai_reasoning,
    industry_summary: adminText.industry_summary,
  });
}
