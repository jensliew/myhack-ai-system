import { describe, it, expect, vi } from "vitest";
import { Timestamp } from "firebase/firestore";

// Mock Firebase dependencies to prevent initialization errors in tests
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  getFirestore: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  doc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  Timestamp: {
    now: () => ({ seconds: 1700000000, nanoseconds: 0, toDate: () => new Date() }),
  },
}));

vi.mock("firebase/storage", () => ({
  getStorage: vi.fn(),
}));

vi.mock("@/firebase/config", () => ({
  auth: { currentUser: null },
  db: {},
  storage: {},
  default: {},
}));

vi.mock("@/firebase/collections", () => ({
  startupsCollection: {},
  mentorsCollection: {},
}));

import { filterStartups } from "./useStartupDiscovery";
import type { StartupDocument } from "@/types/startup.types";
import type { FilterState } from "@/stores/ui.store";

function makeStartup(overrides: Partial<StartupDocument> = {}): StartupDocument {
  return {
    id: "startup-1",
    userId: "user-1",
    name: "TechCorp",
    industry: "Technology",
    stage: "seed",
    fundingStage: "Pre-Seed",
    goals: ["Growth", "Mentorship"],
    description: "A technology startup focused on AI solutions",
    teamSize: 5,
    location: "San Francisco",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

const emptyFilters: FilterState = {
  industry: null,
  stage: null,
  fundingStage: null,
};

describe("filterStartups", () => {
  const startups: StartupDocument[] = [
    makeStartup({ id: "1", name: "TechCorp", industry: "Technology", stage: "seed", fundingStage: "Pre-Seed", description: "AI solutions company" }),
    makeStartup({ id: "2", name: "HealthFirst", industry: "Healthcare", stage: "series-a", fundingStage: "Series A", description: "Digital health platform" }),
    makeStartup({ id: "3", name: "EduLearn", industry: "Education", stage: "idea", fundingStage: "Bootstrapped", description: "Online learning marketplace" }),
    makeStartup({ id: "4", name: "FinTech Pro", industry: "Technology", stage: "series-a", fundingStage: "Series A", description: "Financial technology services" }),
  ];

  describe("search query filtering", () => {
    it("returns all startups when search query is empty", () => {
      const result = filterStartups(startups, "", emptyFilters);
      expect(result).toHaveLength(4);
    });

    it("filters by name (case-insensitive)", () => {
      const result = filterStartups(startups, "techcorp", emptyFilters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("filters by description (case-insensitive)", () => {
      const result = filterStartups(startups, "digital health", emptyFilters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("2");
    });

    it("matches name OR description", () => {
      const result = filterStartups(startups, "technology", emptyFilters);
      // "TechCorp" has "technology" in description ("A technology startup...")
      // "FinTech Pro" has "technology" in description ("Financial technology services")
      // Also "Technology" industry but that's not searched
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.every((s) => 
        s.name.toLowerCase().includes("technology") || 
        s.description.toLowerCase().includes("technology")
      )).toBe(true);
    });

    it("returns empty array when no matches", () => {
      const result = filterStartups(startups, "nonexistent", emptyFilters);
      expect(result).toHaveLength(0);
    });

    it("trims whitespace from search query", () => {
      const result = filterStartups(startups, "   ", emptyFilters);
      expect(result).toHaveLength(4);
    });
  });

  describe("industry filter", () => {
    it("filters by exact industry match", () => {
      const filters: FilterState = { industry: "Technology", stage: null, fundingStage: null };
      const result = filterStartups(startups, "", filters);
      expect(result).toHaveLength(2);
      expect(result.every((s) => s.industry === "Technology")).toBe(true);
    });

    it("returns empty when no industry matches", () => {
      const filters: FilterState = { industry: "Agriculture", stage: null, fundingStage: null };
      const result = filterStartups(startups, "", filters);
      expect(result).toHaveLength(0);
    });
  });

  describe("stage filter", () => {
    it("filters by exact stage match", () => {
      const filters: FilterState = { industry: null, stage: "series-a", fundingStage: null };
      const result = filterStartups(startups, "", filters);
      expect(result).toHaveLength(2);
      expect(result.every((s) => s.stage === "series-a")).toBe(true);
    });
  });

  describe("funding stage filter", () => {
    it("filters by exact funding stage match", () => {
      const filters: FilterState = { industry: null, stage: null, fundingStage: "Series A" };
      const result = filterStartups(startups, "", filters);
      expect(result).toHaveLength(2);
      expect(result.every((s) => s.fundingStage === "Series A")).toBe(true);
    });
  });

  describe("combined filters (AND logic)", () => {
    it("applies search query AND industry filter", () => {
      const filters: FilterState = { industry: "Technology", stage: null, fundingStage: null };
      const result = filterStartups(startups, "AI", filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("applies all filters simultaneously", () => {
      const filters: FilterState = { industry: "Technology", stage: "series-a", fundingStage: "Series A" };
      const result = filterStartups(startups, "", filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("4");
    });

    it("returns empty when combined filters have no matches", () => {
      const filters: FilterState = { industry: "Healthcare", stage: "seed", fundingStage: null };
      const result = filterStartups(startups, "", filters);
      expect(result).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("handles empty startup array", () => {
      const result = filterStartups([], "test", emptyFilters);
      expect(result).toHaveLength(0);
    });

    it("treats null filter values as inactive", () => {
      const filters: FilterState = { industry: null, stage: null, fundingStage: null };
      const result = filterStartups(startups, "", filters);
      expect(result).toHaveLength(4);
    });

    it("treats empty string filter values as inactive", () => {
      const filters: FilterState = { industry: "", stage: "", fundingStage: "" };
      const result = filterStartups(startups, "", filters);
      expect(result).toHaveLength(4);
    });
  });
});
