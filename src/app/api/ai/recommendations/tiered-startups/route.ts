import { NextResponse } from "next/server";

import type { MentorDocument } from "@/types/mentor.types";
import type { StartupDocument } from "@/types/startup.types";
import { aiBackendFetch, AiBackendError } from "@/lib/ai-backend/client";
import { isAiBackendEnabled } from "@/lib/ai-backend/config";
import {
  mentorToBackend,
  startupToBackend,
  tieredCardToRecommendation,
  type TieredMentorCard,
} from "@/lib/ai-backend/mappers";

interface TieredRequest {
  mentor: MentorDocument;
  startups: StartupDocument[];
  explainTop?: number;
  interestedStartupIds?: string[];
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
    const { mentor, startups, explainTop = 3, interestedStartupIds = [] } = body;

    if (!mentor || !startups?.length) {
      return NextResponse.json(
        { error: "mentor and startups are required" },
        { status: 400 }
      );
    }

    const data = await aiBackendFetch<TieredBackendResponse>(
      "/match/startups/tiered",
      {
        method: "POST",
        body: JSON.stringify({
          mentor_id: mentor.id,
          mentor: mentorToBackend(mentor),
          startups: startups.map(startupToBackend),
          interested_startup_ids: interestedStartupIds,
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
      expressedInterest: mapSection(data.interested ?? []),
      modelUsed: "gemini",
    });
  } catch (err) {
    if (err instanceof AiBackendError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Tiered startup recommendations error:", err);
    return NextResponse.json(
      { error: "Failed to load tiered startup recommendations" },
      { status: 500 }
    );
  }
}
