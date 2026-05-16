import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { addDoc, Timestamp } from "firebase/firestore";

import { GEMINI_MODEL, AI_TIMEOUT_MS } from "@/ai/config";
import {
  buildRecommendationSystemPrompt,
  buildRecommendationUserPrompt,
} from "@/ai/prompts";
import { getStartupById, getApprovedMentors } from "@/services/firebase/firestore.service";
import { aiRecommendationsCollection, engagementHistoryCollection } from "@/firebase/collections";
import type { AIRecommendation } from "@/types/ai.types";
import type { EngagementHistoryDocument } from "@/types/matching.types";

interface RecommendationRequest {
  startupId: string;
  userId: string;
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
    const { startupId, userId } = body;

    if (!startupId || !userId) {
      return NextResponse.json(
        { error: "startupId and userId are required" },
        { status: 400 }
      );
    }

    // Fetch startup profile
    const startupResult = await getStartupById(startupId);
    if (startupResult.error || !startupResult.data) {
      return NextResponse.json(
        { error: "Startup not found" },
        { status: 404 }
      );
    }

    // Fetch available mentors
    const mentorsResult = await getApprovedMentors(50);
    if (mentorsResult.error || !mentorsResult.data) {
      return NextResponse.json(
        { error: "Failed to fetch mentors" },
        { status: 500 }
      );
    }

    const startup = startupResult.data;
    const mentors = mentorsResult.data.mentors;

    if (mentors.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Fetch engagement history for this startup's user
    // For now, pass empty history — will be enhanced when engagement service is wired
    const history: EngagementHistoryDocument[] = [];

    // Build prompts
    const systemPrompt = buildRecommendationSystemPrompt();
    const userPrompt = buildRecommendationUserPrompt(startup, mentors, history);

    let aiResponse: AIRecommendationResponse;
    let modelUsed: "gemini" | "gemma" = "gemini";

    try {
      // Call Gemini API
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY not configured");
      }

      const ai = new GoogleGenAI({ apiKey });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      });

      clearTimeout(timeout);

      const text = response.text ?? "";
      aiResponse = JSON.parse(text) as AIRecommendationResponse;
    } catch {
      // Fallback: generate simple rule-based recommendations
      modelUsed = "gemma";
      aiResponse = generateFallbackRecommendations(startup, mentors);
    }

    // Store recommendations in Firestore
    const now = Timestamp.now();
    const storedRecommendations: AIRecommendation[] = [];

    for (const rec of aiResponse.recommendations) {
      const recData: Omit<AIRecommendation, "id"> = {
        startupId,
        mentorId: rec.mentorId,
        compatibilityScore: Math.max(0, Math.min(100, rec.compatibilityScore)),
        reasoning: rec.reasoning,
        modelUsed,
        status: "pending",
        createdAt: now,
      };

      const docRef = await addDoc(aiRecommendationsCollection, recData);
      storedRecommendations.push({ ...recData, id: docRef.id } as AIRecommendation);
    }

    return NextResponse.json({ recommendations: storedRecommendations });
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
 * Uses simple industry and expertise matching.
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
    let score = 50; // Base score

    // Industry match
    if (mentor.industrySpecialization.includes(startup.industry)) {
      score += 25;
    }

    // Expertise overlap with goals
    const goalOverlap = startup.goals.filter((goal) =>
      mentor.expertise.some((exp) =>
        exp.toLowerCase().includes(goal.toLowerCase())
      )
    ).length;
    score += goalOverlap * 5;

    // Success rate bonus
    score += Math.floor(mentor.successRate / 10);

    // Experience bonus
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

  // Sort by score descending and take top 5
  scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  return { recommendations: scored.slice(0, 5) };
}
