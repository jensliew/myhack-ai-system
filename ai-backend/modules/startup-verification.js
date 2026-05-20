import { callGemini } from "../services/gemini.js";
import { formatVerificationCard } from "../services/verification-presentation.js";
import { buildIndustrySummary } from "../services/verification-presentation.js";

export async function verifyStartup(startup) {
  const name = startup.name || startup.startup_name || "Unknown Startup";

  const prompt = `You are an AI evaluator for a startup accelerator program. Evaluate this startup application and return a JSON object.

Startup Name: ${name}
Industry: ${startup.industry || "Not specified"}
Stage: ${startup.stage || "Not specified"}
Team Size: ${startup.teamSize || startup.team_size || "Not specified"}
Description: ${startup.description || "Not provided"}
Goals: ${Array.isArray(startup.goals) ? startup.goals.join(", ") : startup.goals || "Not specified"}
Location: ${startup.location || "Not specified"}
Website: ${startup.website || "Not provided"}

Evaluate and return ONLY a valid JSON object (no markdown, no extra text):
{
  "recommendation": "<APPROVE|PENDING|REJECT>",
  "idea_quality": <0-10>,
  "market_potential": <0-10>,
  "stage_maturity": <0-10>,
  "execution_capability": <0-10>,
  "ecosystem_fit": <0-10>,
  "risk_level": <0-10>,
  "confidence": <0-10>,
  "missing_info": ["<snake_case_field1>", "<snake_case_field2>"],
  "ai_reasoning": "<2-sentence personalised assessment referencing the startup name, industry, and specific scores>",
  "improvement_suggestions": [
    {
      "priority": "<High|Medium|Low>",
      "suggestion": "<detailed, specific, actionable suggestion referencing this startup's actual context and goals>",
      "expected_impact": "<specific impact referencing the score it addresses, e.g. Directly addresses the low execution_capability score and the founder_experience gap>"
    }
  ]
}

Rules:
- APPROVE if score >= 38 and confidence >= 7 and missing_info <= 2
- PENDING if good potential but missing key information
- REJECT if insufficient information or not suitable
- missing_info must use snake_case: founder_experience, product_status, traction_metrics, business_model, competitive_advantage, team_size, website, funding_details
- improvement_suggestions must be personalised to ${name} specifically, not generic advice
- expected_impact must reference the specific score it addresses
- Generate 3-5 improvement suggestions ordered by priority`;

  try {
    const raw = await callGemini(prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const result = JSON.parse(jsonMatch[0]);

    const ai = {
      idea_quality: result.idea_quality ?? 5,
      market_potential: result.market_potential ?? 5,
      stage_maturity: result.stage_maturity ?? 5,
      execution_capability: result.execution_capability ?? 5,
      risk_level: result.risk_level ?? 5,
      ecosystem_fit: result.ecosystem_fit ?? 5,
      confidence: result.confidence ?? 5,
    };

    const final_score = ai.idea_quality + ai.market_potential + ai.stage_maturity +
      ai.execution_capability + ai.ecosystem_fit - ai.risk_level;

    // Use AI-generated suggestions with their own priority and expected_impact
    const suggestions = result.improvement_suggestions?.length > 0
      ? result.improvement_suggestions.map(s =>
          typeof s === "string"
            ? { priority: "High", suggestion: s, expected_impact: "Improves application quality" }
            : { priority: s.priority ?? "High", suggestion: s.suggestion ?? s, expected_impact: s.expected_impact ?? "Improves application quality" }
        )
      : null;

    return formatVerificationCard({
      role: "startup",
      profile: startup,
      recommendation: result.recommendation ?? "PENDING",
      ai_scores: ai,
      final_score,
      confidence: ai.confidence,
      missing_info: result.missing_info ?? [],
      improvement_suggestions: suggestions,
      ai_reasoning: result.ai_reasoning ?? "Application reviewed by AI.",
      industry_summary: buildIndustrySummary("startup", startup),
    });

  } catch (err) {
    console.error("Gemini startup verification failed, using fallback:", err.message);

    // Rule-based fallback
    let idea_quality = 5;
    if (startup.description && startup.description.length > 50) idea_quality += 3;
    if (startup.goals && startup.goals.length > 0) idea_quality += 2;

    let market_potential = 5;
    if (startup.industry) market_potential += 2;
    if (startup.goals && (startup.goals.includes("Scale") || startup.goals.includes("Expand"))) market_potential += 3;

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

    let confidence = 5;
    if (startup.name) confidence += 1;
    if (startup.description) confidence += 1;
    if (startup.industry) confidence += 1;
    if (startup.teamSize) confidence += 1;
    if (startup.goals && startup.goals.length > 0) confidence += 1;

    const missing_info = [];
    if (!startup.description || startup.description.length < 50) missing_info.push("business_description");
    if (!startup.teamSize) missing_info.push("team_size");
    if (!startup.website) missing_info.push("website");
    if (!startup.goals || startup.goals.length === 0) missing_info.push("business_goals");

    const score = idea_quality + market_potential + stage_maturity + execution_capability + ecosystem_fit - risk_level;
    let recommendation = "PENDING";
    if (score < 12) recommendation = "REJECT";
    else if (score >= 38 && missing_info.length <= 2) recommendation = "APPROVE";

    const ai = { idea_quality, market_potential, stage_maturity, execution_capability, risk_level, ecosystem_fit, confidence };

    return formatVerificationCard({
      role: "startup",
      profile: startup,
      recommendation,
      ai_scores: ai,
      final_score: score,
      confidence,
      missing_info,
      improvement_suggestions: null,
      ai_reasoning: `${name} has been evaluated based on available profile data. ${missing_info.length > 0 ? `Outstanding items: ${missing_info.join(", ")}.` : "Profile appears complete."}`,
      industry_summary: buildIndustrySummary("startup", startup),
    });
  }
}
