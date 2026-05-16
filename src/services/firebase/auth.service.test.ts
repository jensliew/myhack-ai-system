import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserCredential, User } from "firebase/auth";
import { Timestamp } from "firebase/firestore";

// Mock firebase/auth
vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  getAuth: vi.fn(() => ({ currentUser: null })),
}));

// Mock firebase/firestore
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1700000000, nanoseconds: 0 })),
  },
  collection: vi.fn(),
  getFirestore: vi.fn(),
}));

// Mock firebase config
vi.mock("@/firebase/config", () => ({
  auth: { currentUser: null },
  db: {},
}));

// Mock firebase collections
vi.mock("@/firebase/collections", () => ({
  usersCollection: {},
}));

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { register, login, logout, getCurrentUser, onAuthChange } from "./auth.service";

const mockCreateUser = createUserWithEmailAndPassword as ReturnType<typeof vi.fn>;
const mockSignIn = signInWithEmailAndPassword as ReturnType<typeof vi.fn>;
const mockSignOut = signOut as ReturnType<typeof vi.fn>;
const mockOnAuthStateChanged = onAuthStateChanged as ReturnType<typeof vi.fn>;
const mockDoc = doc as ReturnType<typeof vi.fn>;
const mockSetDoc = setDoc as ReturnType<typeof vi.fn>;
const mockGetDoc = getDoc as ReturnType<typeof vi.fn>;

describe("auth.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("creates Firebase Auth user and Firestore document on success", async () => {
      const mockUser = { uid: "test-uid-123" } as User;
      const mockCredential = { user: mockUser } as UserCredential;

      mockCreateUser.mockResolvedValue(mockCredential);
      mockDoc.mockReturnValue("user-doc-ref");
      mockSetDoc.mockResolvedValue(undefined);

      const result = await register(
        "test@example.com",
        "password123",
        "startup",
        "entity-1"
      );

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.id).toBe("test-uid-123");
      expect(result.data!.email).toBe("test@example.com");
      expect(result.data!.role).toBe("startup");
      expect(result.data!.entityId).toBe("entity-1");
      expect(result.data!.profileStatus).toBe("pending");
      expect(mockSetDoc).toHaveBeenCalledWith("user-doc-ref", expect.objectContaining({
        id: "test-uid-123",
        email: "test@example.com",
        role: "startup",
        entityId: "entity-1",
        profileStatus: "pending",
      }));
    });

    it("returns error when email is already in use", async () => {
      mockCreateUser.mockRejectedValue({ code: "auth/email-already-in-use" });

      const result = await register(
        "existing@example.com",
        "password123",
        "mentor",
        "entity-2"
      );

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error!.code).toBe("auth/email-already-in-use");
      expect(result.error!.message).toContain("already registered");
      expect(result.error!.retryable).toBe(false);
    });

    it("returns error when password is too weak", async () => {
      mockCreateUser.mockRejectedValue({ code: "auth/weak-password" });

      const result = await register(
        "test@example.com",
        "short",
        "startup",
        "entity-1"
      );

      expect(result.data).toBeNull();
      expect(result.error!.code).toBe("auth/weak-password");
      expect(result.error!.retryable).toBe(false);
    });
  });

  describe("login", () => {
    it("authenticates and returns user document on success", async () => {
      const mockUser = { uid: "user-uid-456" } as User;
      const mockCredential = { user: mockUser } as UserCredential;
      const mockUserDoc = {
        id: "user-uid-456",
        email: "user@example.com",
        role: "mentor",
        entityId: "mentor-1",
        profileStatus: "approved",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      mockSignIn.mockResolvedValue(mockCredential);
      mockDoc.mockReturnValue("user-doc-ref");
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserDoc,
      });

      const result = await login("user@example.com", "password123");

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockUserDoc);
    });

    it("returns error when user document does not exist", async () => {
      const mockUser = { uid: "orphan-uid" } as User;
      const mockCredential = { user: mockUser } as UserCredential;

      mockSignIn.mockResolvedValue(mockCredential);
      mockDoc.mockReturnValue("user-doc-ref");
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null,
      });

      const result = await login("orphan@example.com", "password123");

      expect(result.data).toBeNull();
      expect(result.error!.code).toBe("user/not-found");
    });

    it("returns error for invalid credentials", async () => {
      mockSignIn.mockRejectedValue({ code: "auth/invalid-credential" });

      const result = await login("wrong@example.com", "wrongpass");

      expect(result.data).toBeNull();
      expect(result.error!.code).toBe("auth/invalid-credential");
      expect(result.error!.message).toContain("Invalid email or password");
    });
  });

  describe("logout", () => {
    it("signs out successfully", async () => {
      mockSignOut.mockResolvedValue(undefined);

      const result = await logout();

      expect(result.error).toBeNull();
      expect(mockSignOut).toHaveBeenCalled();
    });

    it("returns error on sign out failure", async () => {
      mockSignOut.mockRejectedValue({ code: "auth/network-request-failed" });

      const result = await logout();

      expect(result.error).not.toBeNull();
      expect(result.error!.code).toBe("auth/network-request-failed");
      expect(result.error!.retryable).toBe(true);
    });
  });

  describe("getCurrentUser", () => {
    it("returns null when no user is authenticated", () => {
      const user = getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe("onAuthChange", () => {
    it("calls callback with user document when user is authenticated", async () => {
      const mockUserDoc = {
        id: "uid-789",
        email: "active@example.com",
        role: "admin",
        entityId: "admin-1",
        profileStatus: "approved",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      mockDoc.mockReturnValue("user-doc-ref");
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserDoc,
      });

      mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
        callback({ uid: "uid-789" } as User);
        return () => {};
      });

      const cb = vi.fn();
      onAuthChange(cb);

      // Wait for async operations
      await vi.waitFor(() => {
        expect(cb).toHaveBeenCalledWith(mockUserDoc);
      });
    });

    it("calls callback with null when user signs out", () => {
      mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
        callback(null);
        return () => {};
      });

      const cb = vi.fn();
      onAuthChange(cb);

      expect(cb).toHaveBeenCalledWith(null);
    });

    it("returns an unsubscribe function", () => {
      const unsubscribe = vi.fn();
      mockOnAuthStateChanged.mockReturnValue(unsubscribe);

      const result = onAuthChange(vi.fn());

      expect(result).toBe(unsubscribe);
    });
  });
});
