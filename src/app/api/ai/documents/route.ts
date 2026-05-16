import { NextResponse } from "next/server";

import { aiBackendFetch, AiBackendError } from "@/lib/ai-backend/client";
import { isAiBackendEnabled } from "@/lib/ai-backend/config";

/**
 * Proxy document analysis to Express AI backend.
 * POST body: { type: "meeting_minutes" | "monthly_report", ...fields }
 */
export async function POST(request: Request) {
  if (!isAiBackendEnabled()) {
    return NextResponse.json(
      { error: "AI backend not enabled" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const type = body.type as string;

    const path =
      type === "monthly_report"
        ? "/documents/monthly-report"
        : "/documents/meeting-minutes";

    const result = await aiBackendFetch(path, {
      method: "POST",
      body: JSON.stringify(body),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof AiBackendError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Document analysis failed" },
      { status: 500 }
    );
  }
}
