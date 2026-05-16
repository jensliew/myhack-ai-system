import { Timestamp } from "firebase/firestore";

import type { AIRecommendation } from "./ai.types";

/**
 * Firestore document schema for the `mentor_interests` collection.
 */
export interface InterestRecord {
  id: string; // Auto-generated
  mentorId: string; // Reference to mentors collection
  startupId: string; // Reference to startups collection
  status: "pending" | "accepted" | "rejected";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Firestore document schema for the `relationships` collection.
 */
export interface RelationshipRecord {
  id: string; // Auto-generated
  mentorId: string; // Reference to mentors collection
  startupId: string; // Reference to startups collection
  status: "active" | "completed" | "paused";
  source: "ai_recommendation" | "mentor_interest";
  engagementScore: number; // 0-100, updated over time
  meetingCount: number;
  lastInteraction: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Firestore document schema for the `feedback` collection.
 */
export interface FeedbackDocument {
  id: string; // Auto-generated
  relationshipId: string; // Reference to relationships collection
  fromUserId: string; // Reference to users collection
  fromRole: "startup" | "mentor";
  rating: number; // 1-5
  comment: string;
  createdAt: Timestamp;
}

/**
 * Firestore document schema for the `engagement_history` collection.
 */
export interface EngagementHistoryDocument {
  id: string; // Auto-generated
  userId: string; // Reference to users collection
  actionType: "interested" | "accepted" | "rejected" | "viewed";
  targetId: string; // ID of the target entity (mentor or startup)
  targetType: "mentor" | "startup";
  metadata?: Record<string, unknown>; // Additional context
  createdAt: Timestamp;
}

/**
 * Zustand store state for the matching workflow.
 */
export interface MatchingState {
  recommendations: AIRecommendation[];
  interestedMentors: InterestRecord[];
  loading: boolean;
  setRecommendations: (recs: AIRecommendation[]) => void;
  setInterestedMentors: (mentors: InterestRecord[]) => void;
  removeFromList: (mentorId: string) => void;
}
