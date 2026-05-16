import { Timestamp } from "firebase/firestore";

/**
 * User roles supported by the platform.
 */
export type UserRole = "admin" | "startup" | "mentor";

/**
 * Firestore document schema for the `users` collection.
 */
export interface UserDocument {
  id: string; // Firebase Auth UID
  email: string;
  role: UserRole;
  entityId: string; // Reference to startup or mentor document
  profileStatus: "pending" | "approved" | "rejected";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
