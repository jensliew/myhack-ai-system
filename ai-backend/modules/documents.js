import { analyzeMeetingMinutes } from "./meeting-minutes-analysis.js";
import { analyzeMonthlyReport } from "./monthly-report-analysis.js";
import { saveDocument } from "../services/document-store.js";
import {
  recordMeetingMinutesAnalysis,
  recordMonthlyReportAnalysis,
} from "../services/collaboration-store.js";

export async function processMeetingMinutes(payload) {
  const {
    startup_id,
    mentor_id,
    content,
    title,
    period,
    industry,
    stage,
    startup_name,
    file_name,
  } = payload;

  if (!startup_id || !mentor_id || !content?.trim()) {
    throw new Error("startup_id, mentor_id, and content are required");
  }

  const analysis = await analyzeMeetingMinutes({
    content,
    startup_id,
    mentor_id,
    title,
    period,
  });

  const doc = saveDocument({
    type: "meeting_minutes",
    startup_id,
    mentor_id,
    title,
    period,
    file_name,
    content_preview: content.slice(0, 200),
    analysis,
  });

  const collaboration = recordMeetingMinutesAnalysis(
    { startup_id, mentor_id, industry, stage, startup_name },
    analysis
  );

  return { document: doc, analysis, collaboration };
}

export async function processMonthlyReport(payload) {
  const {
    startup_id,
    mentor_id,
    content,
    title,
    period,
    industry,
    stage,
    startup_name,
    file_name,
  } = payload;

  if (!startup_id || !mentor_id || !content?.trim()) {
    throw new Error("startup_id, mentor_id, and content are required");
  }

  const analysis = await analyzeMonthlyReport({
    content,
    startup_id,
    mentor_id,
    title,
    period,
  });

  const doc = saveDocument({
    type: "monthly_report",
    startup_id,
    mentor_id,
    title,
    period,
    file_name,
    content_preview: content.slice(0, 200),
    analysis,
  });

  const collaboration = recordMonthlyReportAnalysis(
    { startup_id, mentor_id, industry, stage, startup_name },
    analysis
  );

  return { document: doc, analysis, collaboration };
}
