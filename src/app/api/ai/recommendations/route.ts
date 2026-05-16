import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

import { GEMINI_MODEL } from "@/ai/config";
import {
  buildRecommendationSystemPrompt,
  buildRecommendationUserPrompt,
} from "@/ai/prompts";
import type { StartupDocument } from "@/types/startup.types";
import type { MentorDocument } from "@/types/mentor.types";
import type { EngagementHistoryDocument } from "@/types/matching.types";

interface RecommendationRequest {
  startup: StartupDocument;
  mentors: MentorDocument[];
  history: EngagementHistoryDocument[];
}

interface AIRecommendationResponse {
  recommendations: Array<{
    mentorId: string;
    compatibilityScore: number;
    reasoning: string;
  }>;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecommendationRequest;
    const { startup, mentors, history } = body;

    if (!startup || !mentors) {
      return NextResponse.json(
        { error: "startup and mentors data are required" },
        { status: 400 }
      );
    }

    if (mentors.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Build prompts
    const systemPrompt = buildRecommendationSystemPrompt();
    const userPrompt = buildRecommendationUserPrompt(
      startup as StartupDocument,
      mentors as MentorDocument[],
      history ?? []
    );

    let aiResponse: AIRecommendationResponse;
    let modelUsed: "gemini" | "gemma" = "gemini";

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY not configured");
      }

      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: systemPrompt + "\n\n" + userPrompt + "\n\nRespond with valid JSON only.",
      });

      const text = response.text ?? "";
      // Extract JSON from response (model might wrap it in markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]) as AIRecommendationResponse;
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (aiError) {
      console.error("Gemini API error:", aiError);
      // Fallback: generate simple rule-based recommendations
      modelUsed = "gemma";
      aiResponse = generateFallbackRecommendations(startup, mentors);
    }

    // Return recommendations with model info (client will store in Firestore)
    const recommendations = aiResponse.recommendations.map((rec) => ({
      ...rec,
      compatibilityScore: Math.max(0, Math.min(100, rec.compatibilityScore)),
      modelUsed,
    }));

    return NextResponse.json({ recommendations, modelUsed });
  } catch (error: unknown) {
    console.error("AI recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}

/**
 * Fallback recommendation generator when AI services are unavailable.
 */
function generateFallbackRecommendations(
  startup: { industry: string; stage: string; goals: string[] },
  mentors: Array<{
    id: string;
    expertise: string[];
    industrySpecialization: string[];
    successRate: number;
    mentorshipCount: number;
  }>
): AIRecommendationResponse {
  const scored = mentors.map((mentor) => {
    let score = 50;

    if (mentor.industrySpecialization.includes(startup.industry)) {
      score += 25;
    }

    const goalOverlap = startup.goals.filter((goal) =>
      mentor.expertise.some((exp) =>
        exp.toLowerCase().includes(goal.toLowerCase())
      )
    ).length;
    score += goalOverlap * 5;
    score += Math.floor(mentor.successRate / 10);
    if (mentor.mentorshipCount > 5) score += 5;

    return {
      mentorId: mentor.id,
      compatibilityScore: Math.min(100, score),
      reasoning: `Matched based on ${
        mentor.industrySpecialization.includes(startup.industry)
          ? "industry alignment"
          : "expertise overlap"
      } with ${mentor.mentorshipCount} completed mentorships and ${mentor.successRate}% success rate.`,
    };
  });

  scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  return { recommendations: scored.slice(0, 5) };
}
