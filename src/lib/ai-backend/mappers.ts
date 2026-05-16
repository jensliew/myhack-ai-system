import type { MentorDocument } from "@/types/mentor.types";
import type { StartupDocument } from "@/types/startup.types";
import type { VerificationResult } from "@/types/ai.types";

/** Backend mentor shape (snake_case fields). */
export function mentorToBackend(mentor: MentorDocument) {
  return {
    id: mentor.id,
    full_name: mentor.name,
    location: mentor.location,
    experience: mentor.experience,
    availability: mentor.availability,
    expertise: [...mentor.expertise, ...mentor.industrySpecialization],
    bio: mentor.bio,
    success_rate: mentor.successRate,
    mentorship_count: mentor.mentorshipCount,
  };
}

export function startupToBackend(startup: StartupDocument) {
  return {
    id: startup.id,
    startup_name: startup.name,
    stage: startup.stage,
    team_size: startup.teamSize,
    goals: startup.goals,
    description: startup.description,
    industry: startup.industry,
    funding_stage: startup.fundingStage,
    location: startup.location,
    website: startup.website ?? "",
  };
}

export function profileToBackend(
  applicationType: "startup" | "mentor",
  applicationData: Record<string, unknown>
) {
  if (applicationType === "startup") {
    return {
      email: applicationData.email,
      entity_id: applicationData.entityId ?? applicationData.entity_id,
      startup_name: applicationData.name ?? applicationData.startup_name,
      industry: applicationData.industry,
      stage: applicationData.stage,
      funding_stage: applicationData.fundingStage ?? applicationData.funding_stage,
      goals: applicationData.goals,
      description: applicationData.description,
      team_size: applicationData.teamSize ?? applicationData.team_size,
      location: applicationData.location,
      website: applicationData.website ?? "",
    };
  }

  return {
    email: applicationData.email,
    entity_id: applicationData.entityId ?? applicationData.entity_id,
    full_name: applicationData.name ?? applicationData.full_name,
    expertise: applicationData.expertise ?? applicationData.industrySpecialization,
    experience: applicationData.experience,
    availability: applicationData.availability,
    bio: applicationData.bio,
    location: applicationData.location,
  };
}

type BackendVerification = {
  ai_recommendation?: string;
  ai_recommendation_code?: string;
  ai_reasoning?: string;
  industry_summary?: string;
  recommendation?: string;
};

function mapRecommendationCode(code: string | undefined): VerificationResult["recommendation"] {
  const normalized = (code ?? "").toUpperCase();
  if (normalized === "APPROVE") return "approve";
  if (normalized === "REJECT") return "reject";
  return "pending review";
}

export function backendVerificationToResult(
  applicationId: string,
  backend: BackendVerification
): Omit<VerificationResult, "createdAt"> {
  const recommendation = mapRecommendationCode(
    backend.ai_recommendation_code ?? backend.recommendation
  );

  return {
    applicationId,
    recommendation,
    summary: {
      companyInfo: "",
      mentorInfo: "",
      industryClassification:
        backend.industry_summary?.replace(/^Industry:\s*/i, "") ??
        "See AI reasoning",
      completenessAssessment: backend.ai_reasoning ?? "No AI reasoning returned.",
    },
    modelUsed: "gemini",
  };
}

export type TieredMentorCard = {
  mentor_id: string;
  full_name: string;
  match_percentage: number;
  ai_match_reasoning: string;
  tier_label: string;
  recommendation_tier: number;
};

export function tieredCardToRecommendation(card: TieredMentorCard) {
  return {
    mentorId: card.mentor_id,
    compatibilityScore: card.match_percentage,
    reasoning: card.ai_match_reasoning,
    tierLabel: card.tier_label,
    tier: card.recommendation_tier,
  };
}
