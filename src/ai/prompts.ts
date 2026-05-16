import type { StartupDocument } from "@/types/startup.types";
import type { MentorDocument } from "@/types/mentor.types";
import type { EngagementHistoryDocument } from "@/types/matching.types";
import { MAX_RECOMMENDATIONS } from "./config";

/**
 * Builds the system prompt for mentor recommendation generation.
 */
export function buildRecommendationSystemPrompt(): string {
  return `You are an AI mentor-startup matching engine for Nexora, an ecosystem intelligence platform.

Your task is to analyze a startup's profile and a pool of available mentors, then recommend the top ${MAX_RECOMMENDATIONS} most compatible mentors.

For each recommendation, provide:
1. The mentor's ID
2. A compatibility score (0-100) based on expertise alignment, industry match, and mentorship track record
3. A brief reasoning explaining why this mentor is a good fit (2-3 sentences)

Consider these factors when scoring:
- Industry expertise alignment with the startup's industry
- Stage-appropriate mentorship experience
- Track record (success rate, number of mentorships)
- Complementary skills to the startup's goals

Respond ONLY with valid JSON in this exact format:
{
  "recommendations": [
    {
      "mentorId": "string",
      "compatibilityScore": number,
      "reasoning": "string"
    }
  ]
}`;
}

/**
 * Builds the user prompt with startup context, mentor pool, and engagement history.
 */
export function buildRecommendationUserPrompt(
  startup: StartupDocument,
  mentors: MentorDocument[],
  history: EngagementHistoryDocument[]
): string {
  const startupContext = `
STARTUP PROFILE:
- Name: ${startup.name}
- Industry: ${startup.industry}
- Stage: ${startup.stage}
- Funding: ${startup.fundingStage}
- Goals: ${startup.goals.join(", ")}
- Description: ${startup.description}
- Location: ${startup.location}
`;

  const mentorPool = mentors
    .map(
      (m) => `
- ID: ${m.id}
  Name: ${m.name}
  Expertise: ${m.expertise.join(", ")}
  Industries: ${m.industrySpecialization.join(", ")}
  Experience: ${m.experience}
  Availability: ${m.availability}
  Mentorships Completed: ${m.mentorshipCount}
  Success Rate: ${m.successRate}%
  Location: ${m.location}`
    )
    .join("\n");

  // Summarize engagement history for context
  const rejectedMentorIds = history
    .filter((h) => h.actionType === "rejected" && h.targetType === "mentor")
    .map((h) => h.targetId);

  const acceptedMentorIds = history
    .filter((h) => h.actionType === "accepted" && h.targetType === "mentor")
    .map((h) => h.targetId);

  let historyContext = "";
  if (rejectedMentorIds.length > 0) {
    historyContext += `\nPreviously rejected mentor IDs (avoid recommending): ${rejectedMentorIds.join(", ")}`;
  }
  if (acceptedMentorIds.length > 0) {
    historyContext += `\nPreviously accepted mentor IDs (similar profiles preferred): ${acceptedMentorIds.join(", ")}`;
  }

  return `${startupContext}

AVAILABLE MENTORS:
${mentorPool}
${historyContext}

Please recommend the top ${MAX_RECOMMENDATIONS} most compatible mentors for this startup. Return valid JSON only.`;
}

/**
 * Builds the system prompt for application verification.
 */
export function buildVerificationSystemPrompt(): string {
  return `You are an AI verification assistant for Nexora, an ecosystem intelligence platform.

Your task is to analyze application documents and provide a verification summary with a recommendation.

For each application, extract:
1. Company/mentor information
2. Industry classification
3. Completeness assessment (what information is present vs missing)

Then provide a recommendation:
- "approve" — if the application is complete and legitimate
- "reject" — if the application has significant issues or appears fraudulent
- "pending review" — if additional information is needed

Respond ONLY with valid JSON in this exact format:
{
  "recommendation": "approve" | "reject" | "pending review",
  "summary": {
    "companyInfo": "string",
    "mentorInfo": "string",
    "industryClassification": "string",
    "completenessAssessment": "string"
  }
}`;
}

/**
 * Builds the user prompt for application verification.
 */
export function buildVerificationUserPrompt(
  applicationType: "startup" | "mentor",
  applicationData: Record<string, unknown>,
  documentNames: string[]
): string {
  return `APPLICATION TYPE: ${applicationType}

APPLICATION DATA:
${JSON.stringify(applicationData, null, 2)}

UPLOADED DOCUMENTS:
${documentNames.length > 0 ? documentNames.join(", ") : "No documents uploaded"}

Please analyze this application and provide your verification summary and recommendation. Return valid JSON only.`;
}
