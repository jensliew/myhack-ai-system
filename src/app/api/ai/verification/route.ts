import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

import { GEMINI_MODEL } from "@/ai/config";
import {
  buildVerificationSystemPrompt,
  buildVerificationUserPrompt,
} from "@/ai/prompts";
import type { VerificationResult } from "@/types/ai.types";
import { isAiBackendEnabled } from "@/lib/ai-backend/config";
import { aiBackendFetch, AiBackendError } from "@/lib/ai-backend/client";
import {
  backendVerificationToResult,
  profileToBackend,
} from "@/lib/ai-backend/mappers";

interface VerificationRequest {
  applicationId: string;
  applicationType: "startup" | "mentor";
  applicationData: Record<string, unknown>;
  documentNames: string[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerificationRequest;
    const { applicationId, applicationType, applicationData, documentNames } =
      body;

    if (!applicationId || !applicationType || !applicationData) {
      return NextResponse.json(
        { error: "applicationId, applicationType, and applicationData are required" },
        { status: 400 }
      );
    }

    if (isAiBackendEnabled()) {
      try {
        const payload = profileToBackend(applicationType, {
          ...applicationData,
          documents: documentNames,
        });
        const path =
          applicationType === "startup"
            ? "/verify-startup"
            : "/verify-mentor";
        const backend = await aiBackendFetch<Record<string, unknown>>(path, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const mapped = backendVerificationToResult(applicationId, backend);
        const result: VerificationResult = {
          ...mapped,
          createdAt: new Date() as unknown as import("firebase/firestore").Timestamp,
        };
        return NextResponse.json(result);
      } catch (err) {
        if (err instanceof AiBackendError && err.status < 500) {
          return NextResponse.json({ error: err.message }, { status: err.status });
        }
        console.error("AI backend verification failed, falling back:", err);
      }
    }

    const systemPrompt = buildVerificationSystemPrompt();
    const userPrompt = buildVerificationUserPrompt(
      applicationType,
      applicationData,
      documentNames ?? []
    );

    let verificationResult: Omit<
      VerificationResult,
      "applicationId" | "modelUsed" | "createdAt"
    >;
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
        verificationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (aiError: unknown) {
      console.error("Gemini API error:", aiError);
      modelUsed = "gemma";
      verificationResult = generateFallbackVerification(
        applicationType,
        applicationData,
        documentNames ?? []
      );
    }

    const result: VerificationResult = {
      applicationId,
      recommendation: verificationResult.recommendation as VerificationResult["recommendation"],
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

function generateFallbackVerification(
  applicationType: "startup" | "mentor",
  applicationData: Record<string, unknown>,
  documentNames: string[]
) {
  const hasDocuments = documentNames.length > 0;
  const hasName = !!applicationData.name;
  const hasDescription = !!applicationData.description || !!applicationData.bio;

  let recommendation: VerificationResult["recommendation"] = "pending review";
  if (hasDocuments && hasName && hasDescription) {
    recommendation = "approve";
  } else if (!hasName) {
    recommendation = "reject";
  }

  return {
    recommendation,
    summary: {
      companyInfo:
        applicationType === "startup"
          ? `Startup: ${applicationData.name ?? "Not provided"}`
          : "",
      mentorInfo:
        applicationType === "mentor"
          ? `Mentor: ${applicationData.name ?? "Not provided"}`
          : "",
      industryClassification: (applicationData.industry as string) ?? "Not classified",
      completenessAssessment: hasDocuments
        ? `Application includes ${documentNames.length} document(s). Core fields are ${hasName && hasDescription ? "complete" : "partially complete"}.`
        : "No documents uploaded. Manual review recommended.",
    },
  };
}
