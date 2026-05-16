import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "../data/collaborations.json");

function loadCollaborations() {
  if (!existsSync(DATA_FILE)) return [];
  return JSON.parse(readFileSync(DATA_FILE, "utf8"));
}

function saveCollaborations(list) {
  writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

/** @type {Array<object>} */
let collaborations = loadCollaborations();

function pairKey(mentor_id, startup_id) {
  return `${mentor_id}::${startup_id}`;
}

export function getCollaboration(mentor_id, startup_id) {
  return collaborations.find(
    (c) => c.mentor_id === mentor_id && c.startup_id === startup_id
  );
}

export function upsertCollaborationMeta({
  mentor_id,
  startup_id,
  industry,
  stage,
  startup_name,
}) {
  let row = getCollaboration(mentor_id, startup_id);
  if (!row) {
    row = {
      mentor_id,
      startup_id,
      startup_name: startup_name ?? null,
      industry: industry ?? null,
      stage: stage ?? null,
      engagement_scores: [],
      success_scores: [],
      meeting_minutes_count: 0,
      monthly_reports_count: 0,
    };
    collaborations.push(row);
  } else {
    if (industry) row.industry = industry;
    if (stage) row.stage = stage;
    if (startup_name) row.startup_name = startup_name;
  }
  recomputeAverages(row);
  saveCollaborations(collaborations);
  return row;
}

function recomputeAverages(row) {
  const eng = row.engagement_scores ?? [];
  const suc = row.success_scores ?? [];
  row.avg_engagement =
    eng.length > 0
      ? Math.round(eng.reduce((a, b) => a + b, 0) / eng.length)
      : null;
  row.avg_success =
    suc.length > 0
      ? Math.round(suc.reduce((a, b) => a + b, 0) / suc.length)
      : null;
  row.collaboration_score = computeCollaborationScore(row);
}

function computeCollaborationScore(row) {
  const eng = row.avg_engagement ?? 0;
  const suc = row.avg_success ?? 0;
  const docs =
    (row.meeting_minutes_count ?? 0) + (row.monthly_reports_count ?? 0);
  const docBoost = Math.min(docs * 2, 10);
  if (!eng && !suc) return 0;
  if (!eng) return Math.min(suc + docBoost, 100);
  if (!suc) return Math.min(eng + docBoost, 100);
  return Math.min(Math.round(eng * 0.45 + suc * 0.45 + docBoost), 100);
}

export function recordMeetingMinutesAnalysis(
  { mentor_id, startup_id, industry, stage, startup_name },
  analysis
) {
  const row = upsertCollaborationMeta({
    mentor_id,
    startup_id,
    industry,
    stage,
    startup_name,
  });
  row.engagement_scores.push(analysis.engagement_score ?? 0);
  row.meeting_minutes_count = (row.meeting_minutes_count ?? 0) + 1;
  row.last_meeting_analysis = {
    at: new Date().toISOString(),
    engagement_score: analysis.engagement_score,
    interaction_quality: analysis.interaction_quality,
    summary: analysis.summary,
  };
  recomputeAverages(row);
  saveCollaborations(collaborations);
  return row;
}

export function recordMonthlyReportAnalysis(
  { mentor_id, startup_id, industry, stage, startup_name },
  analysis
) {
  const row = upsertCollaborationMeta({
    mentor_id,
    startup_id,
    industry,
    stage,
    startup_name,
  });
  row.success_scores.push(analysis.success_score ?? 0);
  row.monthly_reports_count = (row.monthly_reports_count ?? 0) + 1;
  row.last_report_analysis = {
    at: new Date().toISOString(),
    success_score: analysis.success_score,
    project_health: analysis.project_health,
    summary: analysis.summary,
  };
  recomputeAverages(row);
  saveCollaborations(collaborations);
  return row;
}

export function getMentorCollaborationHistory(mentor_id) {
  return collaborations.filter((c) => c.mentor_id === mentor_id);
}

export function getAllCollaborations() {
  return collaborations;
}

export function reloadCollaborations() {
  collaborations = loadCollaborations();
  return collaborations;
}
