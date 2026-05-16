import { Timestamp } from "firebase/firestore";

/**
 * AI model identifiers used by the platform.
 */
export type AIModel = "gemini" | "gemma";

/**
 * Firestore document schema for the `ai_recommendations` collection.
 */
export interface AIRecommendation {
  id: string; // Auto-generated
  startupId: string; // Reference to startups collection
  mentorId: string; // Reference to mentors collection
  compatibilityScore: number; // 0-100
  reasoning: string; // AI-generated explanation
  modelUsed: AIModel;
  status: "pending" | "accepted" | "rejected";
  createdAt: Timestamp;
}

/**
 * Result of an AI verification analysis for admin application review.
 */
export interface VerificationResult {
  applicationId: string;
  recommendation: "approve" | "reject" | "pending review";
  summary: {
    companyInfo: string;
    mentorInfo: string;
    industryClassification: string;
    completenessAssessment: string;
  };
  modelUsed: AIModel;
  createdAt: Timestamp;
}

/**
 * Raw response shape from the AI model (Gemini or Gemma).
 */
export interface AIResponse {
  recommendations: Array<{
    mentorId: string;
    compatibilityScore: number;
    reasoning: string;
  }>;
  modelUsed: AIModel;
}
