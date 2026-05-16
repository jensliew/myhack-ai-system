import {
  collection,
  CollectionReference,
} from "firebase/firestore";

import { db } from "./config";
import type { UserDocument } from "@/types/user.types";
import type { StartupDocument } from "@/types/startup.types";
import type { MentorDocument } from "@/types/mentor.types";
import type {
  InterestRecord,
  RelationshipRecord,
  FeedbackDocument,
  EngagementHistoryDocument,
} from "@/types/matching.types";
import type { DocumentMetadataRecord } from "@/types/document.types";
import type { AIRecommendation } from "@/types/ai.types";

/**
 * Typed Firestore collection references for all platform collections.
 */

export const usersCollection = collection(
  db,
  "users"
) as CollectionReference<UserDocument>;

export const startupsCollection = collection(
  db,
  "startups"
) as CollectionReference<StartupDocument>;

export const mentorsCollection = collection(
  db,
  "mentors"
) as CollectionReference<MentorDocument>;

export const mentorInterestsCollection = collection(
  db,
  "mentor_interests"
) as CollectionReference<InterestRecord>;

export const relationshipsCollection = collection(
  db,
  "relationships"
) as CollectionReference<RelationshipRecord>;

export const documentsCollection = collection(
  db,
  "documents"
) as CollectionReference<DocumentMetadataRecord>;

export const feedbackCollection = collection(
  db,
  "feedback"
) as CollectionReference<FeedbackDocument>;

export const aiRecommendationsCollection = collection(
  db,
  "ai_recommendations"
) as CollectionReference<AIRecommendation>;

export const engagementHistoryCollection = collection(
  db,
  "engagement_history"
) as CollectionReference<EngagementHistoryDocument>;
