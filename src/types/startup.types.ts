import { Timestamp } from "firebase/firestore";

/**
 * Startup stage values.
 */
export type StartupStage =
  | "idea"
  | "pre-seed"
  | "seed"
  | "series-a"
  | "series-b"
  | "growth";

/**
 * Project phase for mentorship tracking.
 */
export type ProjectPhase = "initial" | "processing" | "final";

/**
 * Firestore document schema for the `startups` collection.
 */
export interface StartupDocument {
  id: string; // Auto-generated
  userId: string; // Reference to users collection
  name: string;
  industry: string;
  stage: StartupStage;
  fundingStage: string;
  goals: string[];
  description: string;
  teamSize: number;
  location: string;
  website?: string;
  projectPhase?: ProjectPhase; // Mentorship project phase: initial -> processing -> final
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Subset of StartupDocument used for display in cards and lists.
 */
export interface StartupProfile {
  id: string;
  name: string;
  industry: string;
  stage: StartupStage;
  fundingStage: string;
  goals: string[];
  description: string;
  teamSize: number;
  location: string;
}
