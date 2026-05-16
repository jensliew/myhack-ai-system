import { formatVerificationCard } from "../services/verification-presentation.js";
import { generateAdminVerificationText } from "./verification-reasoning.js";

export async function verifyMentor(mentor) {
  // Rule-based mentor evaluation (no Gemini API calls)
  
  // Score each category 0-10 based on available data
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
  
  // Calculate confidence based on data completeness
  let confidence = 5;
  if (mentor.name) confidence += 1;
  if (mentor.bio) confidence += 1;
  if (mentor.expertise && mentor.expertise.length > 0) confidence += 1;
  if (mentor.industrySpecialization && mentor.industrySpecialization.length > 0) confidence += 1;
  if (mentor.availability) confidence += 1;
  
  // Identify missing info
  const missing_info = [];
  if (!mentor.bio || mentor.bio.length < 50) missing_info.push("Detailed mentor bio and background");
  if (!mentor.expertise || mentor.expertise.length === 0) missing_info.push("Clear expertise areas");
  if (!mentor.industrySpecialization || mentor.industrySpecialization.length === 0) missing_info.push("Industry specialization");
  if (!mentor.mentorshipCount) missing_info.push("Mentorship experience count");
  
  const score =
    expertise_depth +
    industry_specialization +
    mentoring_capability +
    availability +
    communication_quality +
    program_fit;

  let recommendation = "REJECT";
  if (score < 18) {
    recommendation = "REJECT";
  } else if (missing_info.length > 3) {
    recommendation = "PENDING";
  } else if (confidence < 6 && score < 40) {
    recommendation = "PENDING";
  } else if (score >= 45) {
    recommendation = "APPROVE";
  } else {
    recommendation = "PENDING";
  }

  let suggestions = null;
  if (recommendation === "PENDING") {
    suggestions = [
      {
        priority: "High",
        suggestion: "Write a comprehensive bio highlighting your mentoring experience and success stories",
        expected_impact: "Demonstrates mentoring capability and builds trust with startups"
      },
      {
        priority: "High",
        suggestion: "Clearly list your areas of expertise and industry specialization",
        expected_impact: "Helps match you with startups that need your specific skills"
      },
      {
        priority: "Medium",
        suggestion: "Specify your availability and commitment level",
        expected_impact: "Sets clear expectations for mentorship engagement"
      }
    ];
  }

  const ai = {
    expertise_depth,
    industry_specialization,
    mentoring_capability,
    availability,
    communication_quality,
    program_fit,
    confidence
  };

  const adminText = await generateAdminVerificationText({
    role: "mentor",
    profile: mentor,
    recommendation,
    ai_scores: ai,
    final_score: score,
    missing_info,
  });

  return formatVerificationCard({
    role: "mentor",
    profile: mentor,
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
