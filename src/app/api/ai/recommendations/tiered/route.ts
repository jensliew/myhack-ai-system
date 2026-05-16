import { NextResponse } from "next/server";

import type { StartupDocument } from "@/types/startup.types";
import type { MentorDocument } from "@/types/mentor.types";
import { aiBackendFetch, AiBackendError } from "@/lib/ai-backend/client";
import { isAiBackendEnabled } from "@/lib/ai-backend/config";
import {
  mentorToBackend,
  startupToBackend,
  tieredCardToRecommendation,
  type TieredMentorCard,
} from "@/lib/ai-backend/mappers";

interface TieredRequest {
  startup: StartupDocument;
  mentors: MentorDocument[];
  explainTop?: number;
  interestedMentorIds?: string[];
  activeMentorIds?: string[];
}

interface TieredBackendResponse {
  previous_collaborations: TieredMentorCard[];
  ai_suggested: TieredMentorCard[];
  interested: TieredMentorCard[];
}

export async function POST(request: Request) {
  try {
    if (!isAiBackendEnabled()) {
      return NextResponse.json(
        { error: "AI backend not enabled. Set USE_AI_BACKEND=true" },
        { status: 503 }
      );
    }

    const body = (await request.json()) as TieredRequest;
    const { startup, mentors, explainTop = 3, interestedMentorIds = [], activeMentorIds = [] } = body;

    if (!startup || !mentors?.length) {
      return NextResponse.json(
        { error: "startup and mentors are required" },
        { status: 400 }
      );
    }

    const data = await aiBackendFetch<TieredBackendResponse>(
      "/match/mentors/tiered",
      {
        method: "POST",
        body: JSON.stringify({
          startup_id: startup.id,
          startup: startupToBackend(startup),
          mentors: mentors.map(mentorToBackend),
          interested_mentor_ids: interestedMentorIds,
          active_mentor_ids: activeMentorIds,
          explainTop,
          limit: 10,
        }),
      }
    );

    const mapSection = (cards: TieredMentorCard[]) =>
      cards.map((c) => ({
        ...tieredCardToRecommendation(c),
        modelUsed: "gemini" as const,
      }));

    return NextResponse.json({
      previousCollaborations: mapSection(data.previous_collaborations ?? []),
      aiSuggested: mapSection(data.ai_suggested ?? []),
      interested: mapSection(data.interested ?? []),
      modelUsed: "gemini",
    });
  } catch (err) {
    if (err instanceof AiBackendError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Tiered recommendations error:", err);
    return NextResponse.json(
      { error: "Failed to load tiered recommendations" },
      { status: 500 }
    );
  }
}
