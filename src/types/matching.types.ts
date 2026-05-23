import { Timestamp } from "firebase/firestore";

import type { AIRecommendation } from "./ai.types";

export interface InterestRecord {
  id: string;
  mentorId: string;
  startupId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RelationshipRecord {
  id: string;
  mentorId: string;
  startupId: string;
  status: "active" | "completed" | "paused";
  source: "ai_recommendation" | "mentor_interest";
  engagementScore: number;
  meetingCount: number;
  phase?: "initial" | "processing" | "final";
  lastInteraction: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  completionNote?: string;
}

export interface FeedbackDocument {
  id: string;
  relationshipId: string;
  fromUserId: string;
  fromRole: "startup" | "mentor";
  toEntityId: string;
  rating: number; // 1-5
  comment: string;
  highlights: string[]; // e.g. ["Great communicator", "Very knowledgeable"]
  wouldRecommend: boolean;
  createdAt: Timestamp;
}

export interface MessageDocument {
  id: string;
  relationshipId: string;
  senderId: string;
  senderRole: "startup" | "mentor";
  senderName: string;
  content: string;
  read: boolean;
  createdAt: Timestamp;
}

export interface NotificationDocument {
  id: string;
  userId: string;
  type: "mentor_accepted" | "mentor_interested" | "message_received" | "document_uploaded" | "feedback_received" | "relationship_completed";
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt: Timestamp;
}

export interface MilestoneDocument {
  id: string;
  relationshipId: string;
  title: string;
  description: string;
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  status: "pending" | "in_progress" | "completed" | "overdue";
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EngagementHistoryDocument {
  id: string;
  userId: string;
  actionType: "interested" | "accepted" | "rejected" | "viewed";
  targetId: string;
  targetType: "mentor" | "startup";
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}

export interface MatchingState {
  recommendations: AIRecommendation[];
  interestedMentors: InterestRecord[];
  loading: boolean;
  setRecommendations: (recs: AIRecommendation[]) => void;
  setInterestedMentors: (mentors: InterestRecord[]) => void;
  removeFromList: (mentorId: string) => void;
}
