import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";

import { auth } from "@/firebase/config";
import { usersCollection } from "@/firebase/collections";
import type { ServiceResult } from "@/types/common.types";
import type { UserDocument, UserRole } from "@/types/user.types";

/**
 * Cookie name used for auth session data, read by the proxy for route protection.
 */
const AUTH_COOKIE_NAME = "nexora-auth";

/**
 * Sets the nexora-auth cookie with user uid and role.
 * This cookie is read by the proxy (src/proxy.ts) for route protection.
 */
function setAuthCookie(uid: string, role: UserRole): void {
  const payload = JSON.stringify({ uid, role });
  // Set cookie accessible to the entire app, expires in 7 days
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(payload)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

/**
 * Clears the nexora-auth cookie on logout.
 */
function clearAuthCookie(): void {
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Registers a new user with Firebase Auth and creates a Firestore user document.
 *
 * 1. Creates Firebase Auth account with email/password
 * 2. Creates user document in Firestore users collection
 * 3. Returns the created UserDocument
 */
export async function register(
  email: string,
  password: string,
  role: UserRole,
  entityId: string
): Promise<ServiceResult<UserDocument>> {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const now = Timestamp.now();
    const userDoc: UserDocument = {
      id: credential.user.uid,
      email,
      role,
      entityId,
      profileStatus: "pending",
      createdAt: now,
      updatedAt: now,
    };

    const userRef = doc(usersCollection, credential.user.uid);
    await setDoc(userRef, userDoc);

    // Set auth cookie for proxy-based route protection
    setAuthCookie(userDoc.id, userDoc.role);

    return { data: userDoc, error: null };
  } catch (error: unknown) {
    return { data: null, error: mapFirebaseAuthError(error) };
  }
}

/**
 * Authenticates a user with email/password and fetches their Firestore user document.
 */
export async function login(
  email: string,
  password: string
): Promise<ServiceResult<UserDocument>> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);

    const userRef = doc(usersCollection, credential.user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return {
        data: null,
        error: {
          code: "user/not-found",
          message: "User profile not found. Please contact support.",
          retryable: false,
        },
      };
    }

    const userData = userSnap.data();

    // Set auth cookie for proxy-based route protection
    setAuthCookie(userData.id, userData.role);

    return { data: userData, error: null };
  } catch (error: unknown) {
    return { data: null, error: mapFirebaseAuthError(error) };
  }
}

/**
 * Signs out the current user and clears the session.
 */
export async function logout(): Promise<ServiceResult<void>> {
  try {
    await signOut(auth);
    // Clear auth cookie so proxy redirects to login
    clearAuthCookie();
    return { data: undefined, error: null };
  } catch (error: unknown) {
    return { data: null, error: mapFirebaseAuthError(error) };
  }
}

/**
 * Returns the current Firebase Auth user, or null if not authenticated.
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Subscribes to auth state changes. When a user is authenticated,
 * fetches their Firestore user document and passes it to the callback.
 * Returns an unsubscribe function.
 */
export function onAuthChange(
  callback: (user: UserDocument | null) => void
): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    try {
      const userRef = doc(usersCollection, firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        callback(userSnap.data());
      } else {
        callback(null);
      }
    } catch {
      callback(null);
    }
  });
}

/**
 * Maps Firebase Auth error codes to user-friendly ServiceError messages.
 */
function mapFirebaseAuthError(error: unknown): {
  code: string;
  message: string;
  retryable: boolean;
} {
  const firebaseError = error as { code?: string; message?: string };
  const code = firebaseError.code ?? "auth/unknown";

  switch (code) {
    case "auth/email-already-in-use":
      return {
        code,
        message: "This email is already registered. Please log in instead.",
        retryable: false,
      };
    case "auth/invalid-email":
      return {
        code,
        message: "Please enter a valid email address.",
        retryable: false,
      };
    case "auth/weak-password":
      return {
        code,
        message: "Password is too weak. Please use at least 8 characters.",
        retryable: false,
      };
    case "auth/invalid-credential":
      return {
        code,
        message: "Invalid email or password. Please try again.",
        retryable: false,
      };
    case "auth/user-disabled":
      return {
        code,
        message: "This account has been disabled. Please contact support.",
        retryable: false,
      };
    case "auth/user-not-found":
      return {
        code,
        message: "No account found with this email. Please register first.",
        retryable: false,
      };
    case "auth/wrong-password":
      return {
        code,
        message: "Invalid email or password. Please try again.",
        retryable: false,
      };
    case "auth/too-many-requests":
      return {
        code,
        message:
          "Too many failed attempts. Please wait a moment and try again.",
        retryable: true,
      };
    case "auth/network-request-failed":
      return {
        code,
        message: "Network error. Please check your connection and try again.",
        retryable: true,
      };
    default:
      return {
        code,
        message: "An unexpected error occurred. Please try again.",
        retryable: true,
      };
  }
}
