import { create } from "zustand";

import type { AIRecommendation } from "@/types/ai.types";
import type { InterestRecord } from "@/types/matching.types";

/**
 * Matching store state.
 */
export interface MatchingStoreState {
  recommendations: AIRecommendation[];
  interestedMentors: InterestRecord[];
  loading: boolean;
}

/**
 * Matching store actions.
 */
export interface MatchingStoreActions {
  setRecommendations: (recs: AIRecommendation[]) => void;
  setInterestedMentors: (mentors: InterestRecord[]) => void;
  removeFromList: (mentorId: string) => void;
  setLoading: (loading: boolean) => void;
}

export type MatchingStore = MatchingStoreState & MatchingStoreActions;

/**
 * Zustand store for matching workflow state.
 * Manages AI recommendations and interested mentors lists.
 */
export const useMatchingStore = create<MatchingStore>()((set) => ({
  recommendations: [],
  interestedMentors: [],
  loading: false,
  setRecommendations: (recommendations) => set({ recommendations }),
  setInterestedMentors: (interestedMentors) => set({ interestedMentors }),
  removeFromList: (mentorId) =>
    set((state) => ({
      recommendations: state.recommendations.filter(
        (rec) => rec.mentorId !== mentorId
      ),
      interestedMentors: state.interestedMentors.filter(
        (interest) => interest.mentorId !== mentorId
      ),
    })),
  setLoading: (loading) => set({ loading }),
}));
