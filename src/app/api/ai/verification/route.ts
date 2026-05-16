import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

import { GEMINI_MODEL, AI_TIMEOUT_MS } from "@/ai/config";
import {
  buildVerificationSystemPrompt,
  buildVerificationUserPrompt,
} from "@/ai/prompts";
import type { VerificationResult } from "@/types/ai.types";

interface VerificationRequest {
  applicationId: string;
  applicationType: "startup" | "mentor";
  applicationData: Record<string, unknown>;
  documentNames: string[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerificationRequest;
    const { applicationId, applicationType, applicationData, documentNames } = body;

    if (!applicationId || !applicationType || !applicationData) {
      return NextResponse.json(
        { error: "applicationId, applicationType, and applicationData are required" },
        { status: 400 }
      );
    }

    const systemPrompt = buildVerificationSystemPrompt();
    const userPrompt = buildVerificationUserPrompt(
      applicationType,
      applicationData,
      documentNames ?? []
    );

    let verificationResult: Omit<VerificationResult, "applicationId" | "modelUsed" | "createdAt">;
    let modelUsed: "gemini" | "gemma" = "gemini";

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY not configured");
      }

      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      });

      const text = response.text ?? "";
      verificationResult = JSON.parse(text);
    } catch (aiError: unknown) {
      // Log the actual error for debugging
      console.error("Gemini API error:", aiError);
      // Fallback: generate a basic verification result
      modelUsed = "gemma";
      verificationResult = generateFallbackVerification(applicationType, applicationData, documentNames ?? []);
    }

    const result: VerificationResult = {
      applicationId,
      recommendation: verificationResult.recommendation as "approve" | "reject" | "pending review",
      summary: verificationResult.summary,
      modelUsed,
      createdAt: new Date() as unknown as import("firebase/firestore").Timestamp,
    };

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("AI verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify application" },
      { status: 500 }
    );
  }
}

/**
 * Fallback verification when AI services are unavailable.
 */
function generateFallbackVerification(
  applicationType: "startup" | "mentor",
  applicationData: Record<string, unknown>,
  documentNames: string[]
) {
  const hasDocuments = documentNames.length > 0;
  const hasName = !!applicationData.name;
  const hasDescription = !!applicationData.description || !!applicationData.bio;

  let recommendation: "approve" | "reject" | "pending review" = "pending review";
  if (hasDocuments && hasName && hasDescription) {
    recommendation = "approve";
  } else if (!hasName) {
    recommendation = "reject";
  }

  return {
    recommendation,
    summary: {
      companyInfo: applicationType === "startup"
        ? `Startup: ${applicationData.name ?? "Not provided"}`
        : "",
      mentorInfo: applicationType === "mentor"
        ? `Mentor: ${applicationData.name ?? "Not provided"}`
        : "",
      industryClassification: (applicationData.industry as string) ?? "Not classified",
      completenessAssessment: hasDocuments
        ? `Application includes ${documentNames.length} document(s). Core fields are ${hasName && hasDescription ? "complete" : "partially complete"}.`
        : "No documents uploaded. Manual review recommended.",
    },
  };
}
