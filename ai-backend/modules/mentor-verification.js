import { callGemini } from "../services/gemini.js";
import { formatVerificationCard } from "../services/verification-presentation.js";
import { buildIndustrySummary } from "../services/verification-presentation.js";

export async function verifyMentor(mentor) {
  const name = mentor.name || mentor.full_name || "Unknown Mentor";

  const prompt = `You are an AI evaluator for a startup accelerator mentorship program. Evaluate this mentor application and return a JSON object.

Mentor Name: ${name}
Expertise: ${Array.isArray(mentor.expertise) ? mentor.expertise.join(", ") : mentor.expertise || "Not specified"}
Industry Specialization: ${Array.isArray(mentor.industrySpecialization) ? mentor.industrySpecialization.join(", ") : mentor.industrySpecialization || "Not specified"}
Experience: ${mentor.experience || "Not specified"}
Availability: ${mentor.availability || "Not specified"}
Bio: ${mentor.bio || "Not provided"}
Location: ${mentor.location || "Not specified"}
Mentorship Count: ${mentor.mentorshipCount || "Not specified"}
Success Rate: ${mentor.successRate || "Not specified"}

Evaluate and return ONLY a valid JSON object (no markdown, no extra text):
{
  "recommendation": "<APPROVE|PENDING|REJECT>",
  "expertise_depth": <0-10>,
  "industry_specialization": <0-10>,
  "mentoring_capability": <0-10>,
  "availability": <0-10>,
  "communication_quality": <0-10>,
  "program_fit": <0-10>,
  "confidence": <0-10>,
  "missing_info": ["<snake_case_field1>", "<snake_case_field2>"],
  "ai_reasoning": "<2-sentence personalised assessment referencing the mentor name, expertise, and specific scores>",
  "improvement_suggestions": [
    {
      "priority": "<High|Medium|Low>",
      "suggestion": "<detailed, specific, actionable suggestion referencing this mentor's actual expertise and context>",
      "expected_impact": "<specific impact referencing the score it addresses, e.g. Directly addresses the low mentoring_capability score>"
    }
  ]
}

Rules:
- APPROVE if total score >= 45 and confidence >= 7 and missing_info <= 1
- PENDING if good potential but missing key information
- REJECT if insufficient information or not suitable
- missing_info must use snake_case: industry_specialization, mentorship_experience_count, bio, expertise_areas, availability, success_rate
- improvement_suggestions must be personalised to ${name} specifically, referencing their actual expertise
- expected_impact must reference the specific score it addresses
- Generate 3-5 improvement suggestions ordered by priority`;

  try {
    const raw = await callGemini(prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const result = JSON.parse(jsonMatch[0]);

    const ai = {
      expertise_depth: result.expertise_depth ?? 5,
      industry_specialization: result.industry_specialization ?? 5,
      mentoring_capability: result.mentoring_capability ?? 5,
      availability: result.availability ?? 5,
      communication_quality: result.communication_quality ?? 5,
      program_fit: result.program_fit ?? 5,
      confidence: result.confidence ?? 5,
    };

    const final_score = ai.expertise_depth + ai.industry_specialization + ai.mentoring_capability +
      ai.availability + ai.communication_quality + ai.program_fit;

    // Use AI-generated suggestions with their own priority and expected_impact
    const suggestions = result.improvement_suggestions?.length > 0
      ? result.improvement_suggestions.map(s =>
          typeof s === "string"
            ? { priority: "High", suggestion: s, expected_impact: "Improves application quality" }
            : { priority: s.priority ?? "High", suggestion: s.suggestion ?? s, expected_impact: s.expected_impact ?? "Improves application quality" }
        )
      : null;

    return formatVerificationCard({
      role: "mentor",
      profile: mentor,
      recommendation: result.recommendation ?? "PENDING",
      ai_scores: ai,
      final_score,
      confidence: ai.confidence,
      missing_info: result.missing_info ?? [],
      improvement_suggestions: suggestions,
      ai_reasoning: result.ai_reasoning ?? "Application reviewed by AI.",
      industry_summary: buildIndustrySummary("mentor", mentor),
    });

  } catch (err) {
    console.error("Gemini mentor verification failed, using fallback:", err.message);

    // Rule-based fallback
    let expertise_depth = 5;
    if (mentor.expertise && mentor.expertise.length >= 3) expertise_depth += 3;
    if (mentor.expertise && mentor.expertise.length >= 5) expertise_depth += 2;

    let industry_specialization = 5;
    if (mentor.industrySpecialization && mentor.industrySpecialization.length > 0) industry_specialization += 3;
    if (mentor.industrySpecialization && mentor.industrySpecialization.length >= 2) industry_specialization += 2;

    let mentoring_capability = 5;
    if (mentor.bio && mentor.bio.length > 100) mentoring_capability += 3;
    if (mentor.mentorshipCount && mentor.mentorshipCount > 5) mentoring_capability += 2;

    let availability = 5;
    if (mentor.availability === "full-time") availability = 9;
    else if (mentor.availability === "part-time") availability = 7;
    else if (mentor.availability === "limited") availability = 3;

    let communication_quality = 5;
    if (mentor.bio && mentor.bio.length > 50) communication_quality += 3;
    if (mentor.name && mentor.location) communication_quality += 2;

    let program_fit = 6;
    if (mentor.expertise && mentor.expertise.some(e => ["Fundraising", "Product Strategy", "Growth"].includes(e))) program_fit += 2;

    let confidence = 5;
    if (mentor.name) confidence += 1;
    if (mentor.bio) confidence += 1;
    if (mentor.expertise && mentor.expertise.length > 0) confidence += 1;
    if (mentor.industrySpecialization && mentor.industrySpecialization.length > 0) confidence += 1;
    if (mentor.availability) confidence += 1;

    const missing_info = [];
    if (!mentor.bio || mentor.bio.length < 50) missing_info.push("bio");
    if (!mentor.expertise || mentor.expertise.length === 0) missing_info.push("expertise_areas");
    if (!mentor.industrySpecialization || mentor.industrySpecialization.length === 0) missing_info.push("industry_specialization");
    if (!mentor.mentorshipCount) missing_info.push("mentorship_experience_count");

    const score = expertise_depth + industry_specialization + mentoring_capability + availability + communication_quality + program_fit;
    let recommendation = "PENDING";
    if (score < 18) recommendation = "REJECT";
    else if (score >= 45 && missing_info.length <= 1) recommendation = "APPROVE";

    const ai = { expertise_depth, industry_specialization, mentoring_capability, availability, communication_quality, program_fit, confidence };

    return formatVerificationCard({
      role: "mentor",
      profile: mentor,
      recommendation,
      ai_scores: ai,
      final_score: score,
      confidence,
      missing_info,
      improvement_suggestions: null,
      ai_reasoning: `${name} has been evaluated based on available profile data. ${missing_info.length > 0 ? `Outstanding items: ${missing_info.join(", ")}.` : "Profile appears complete."}`,
      industry_summary: buildIndustrySummary("mentor", mentor),
    });
  }
}
