import { Timestamp } from "firebase/firestore";

/**
 * Mentor availability options.
 */
export type MentorAvailability = "full-time" | "part-time" | "limited";

/**
 * Firestore document schema for the `mentors` collection.
 */
export interface MentorDocument {
  id: string; // Auto-generated
  userId: string; // Reference to users collection
  name: string;
  expertise: string[];
  industrySpecialization: string[];
  experience: string;
  availability: MentorAvailability;
  bio: string;
  mentorshipCount: number; // Total mentorships completed
  successRate: number; // 0-100 percentage
  location: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Subset of MentorDocument used for display in cards and lists.
 */
export interface MentorProfile {
  id: string;
  name: string;
  expertise: string[];
  industrySpecialization: string[];
  experience: string;
  availability: MentorAvailability;
  bio: string;
  mentorshipCount: number;
  successRate: number;
  location: string;
}
