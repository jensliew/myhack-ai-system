import {
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  limit,
  startAfter,
  type DocumentSnapshot,
  type QueryConstraint,
} from "firebase/firestore";

import { startupsCollection, mentorsCollection } from "@/firebase/collections";
import type { ServiceResult } from "@/types/common.types";
import type { StartupDocument } from "@/types/startup.types";
import type { MentorDocument } from "@/types/mentor.types";

/**
 * Default page size for paginated queries.
 */
const DEFAULT_PAGE_SIZE = 10;

/**
 * Fetches approved startups from the startups collection with pagination support.
 *
 * Since only approved users can create startup profiles (admin approval is tracked
 * on the user document via profileStatus), all documents in the startups collection
 * are considered approved for display.
 *
 * @param pageSize - Number of startups to fetch per page (defaults to 10)
 * @param lastDoc - Firestore DocumentSnapshot cursor for pagination
 * @returns ServiceResult containing startups array and the last document for cursor-based pagination
 */
export async function getApprovedStartups(
  pageSize?: number,
  lastDoc?: DocumentSnapshot
): Promise<
  ServiceResult<{ startups: StartupDocument[]; lastDoc: DocumentSnapshot | null }>
> {
  try {
    const size = pageSize ?? DEFAULT_PAGE_SIZE;

    const constraints: QueryConstraint[] = [orderBy("createdAt", "desc"), limit(size)];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(startupsCollection, ...constraints);
    const snapshot = await getDocs(q);

    const startups: StartupDocument[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return { ...data, id: docSnap.id };
    });

    const lastVisible =
      snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1]
        : null;

    return {
      data: { startups, lastDoc: lastVisible },
      error: null,
    };
  } catch (error: unknown) {
    return {
      data: null,
      error: mapFirestoreError(error),
    };
  }
}

/**
 * Fetches a single startup document by ID.
 *
 * @param id - The startup document ID
 * @returns ServiceResult containing the StartupDocument or an error
 */
export async function getStartupById(
  id: string
): Promise<ServiceResult<StartupDocument>> {
  try {
    const docRef = doc(startupsCollection, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        data: null,
        error: {
          code: "firestore/not-found",
          message: "Startup not found.",
          retryable: false,
        },
      };
    }

    return {
      data: { ...docSnap.data()!, id: docSnap.id } as StartupDocument,
      error: null,
    };
  } catch (error: unknown) {
    return {
      data: null,
      error: mapFirestoreError(error),
    };
  }
}

/**
 * Fetches approved mentors from the mentors collection with pagination support.
 *
 * Similar to startups, all documents in the mentors collection are considered
 * approved since only approved users can create mentor profiles.
 *
 * @param pageSize - Number of mentors to fetch per page (defaults to 10)
 * @param lastDoc - Firestore DocumentSnapshot cursor for pagination
 * @returns ServiceResult containing mentors array and the last document for cursor-based pagination
 */
export async function getApprovedMentors(
  pageSize?: number,
  lastDoc?: DocumentSnapshot
): Promise<
  ServiceResult<{ mentors: MentorDocument[]; lastDoc: DocumentSnapshot | null }>
> {
  try {
    const size = pageSize ?? DEFAULT_PAGE_SIZE;

    const constraints: QueryConstraint[] = [orderBy("createdAt", "desc"), limit(size)];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(mentorsCollection, ...constraints);
    const snapshot = await getDocs(q);

    const mentors: MentorDocument[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return { ...data, id: docSnap.id };
    });

    const lastVisible =
      snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1]
        : null;

    return {
      data: { mentors, lastDoc: lastVisible },
      error: null,
    };
  } catch (error: unknown) {
    return {
      data: null,
      error: mapFirestoreError(error),
    };
  }
}

/**
 * Fetches a single mentor document by ID.
 *
 * @param id - The mentor document ID
 * @returns ServiceResult containing the MentorDocument or an error
 */
export async function getMentorById(
  id: string
): Promise<ServiceResult<MentorDocument>> {
  try {
    const docRef = doc(mentorsCollection, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        data: null,
        error: {
          code: "firestore/not-found",
          message: "Mentor not found.",
          retryable: false,
        },
      };
    }

    return {
      data: { ...docSnap.data()!, id: docSnap.id } as MentorDocument,
      error: null,
    };
  } catch (error: unknown) {
    return {
      data: null,
      error: mapFirestoreError(error),
    };
  }
}

/**
 * Maps Firestore errors to structured ServiceError objects.
 */
function mapFirestoreError(error: unknown): {
  code: string;
  message: string;
  retryable: boolean;
} {
  const firestoreError = error as { code?: string; message?: string };
  const code = firestoreError.code ?? "firestore/unknown";

  switch (code) {
    case "permission-denied":
      return {
        code: "firestore/permission-denied",
        message: "You do not have permission to access this data.",
        retryable: false,
      };
    case "not-found":
      return {
        code: "firestore/not-found",
        message: "The requested document was not found.",
        retryable: false,
      };
    case "unavailable":
      return {
        code: "firestore/unavailable",
        message:
          "The service is temporarily unavailable. Please try again later.",
        retryable: true,
      };
    case "resource-exhausted":
      return {
        code: "firestore/resource-exhausted",
        message: "Too many requests. Please wait a moment and try again.",
        retryable: true,
      };
    default:
      return {
        code,
        message: "An unexpected error occurred while fetching data.",
        retryable: true,
      };
  }
}
