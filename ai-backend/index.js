import "dotenv/config";
import express from "express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { verifyStartup } from "./modules/startup-verification.js";
import { verifyMentor } from "./modules/mentor-verification.js";
import { getTieredMentorRecommendations } from "./modules/tiered-matching.js";
import {
  getTieredStartupRecommendations,
  matchMentorsForStartup,
  matchStartupsForMentor,
} from "./modules/matching.js";
import {
  addInterest,
  getInterestedMentorIds,
  getInterestedMentors,
} from "./services/interest-store.js";
import { calculateMatchScore } from "./services/matching.js";
import {
  processMeetingMinutes,
  processMonthlyReport,
} from "./modules/documents.js";
import { listDocumentsByStartup } from "./services/document-store.js";
import { getAllCollaborations } from "./services/collaboration-store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sample = JSON.parse(
  readFileSync(join(__dirname, "data", "sample-profiles.json"), "utf8")
);

const app = express();
app.use(express.json());

// Enable CORS for localhost development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3001");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.post("/verify-startup", async (req, res) => {
  const result = await verifyStartup(req.body);
  res.json(result);
});

app.post("/verify-mentor", async (req, res) => {
  const result = await verifyMentor(req.body);
  res.json(result);
});

/** Startup dashboard: AI-suggested mentors */
app.get("/match/mentors/:startupId", async (req, res) => {
  try {
    const startup =
      req.body?.startup ??
      sample.startups.find((s) => s.id === req.params.startupId);
    if (!startup) {
      return res.status(404).json({ error: "Startup not found" });
    }
    const mentors = req.body?.mentors ?? sample.mentors;
    const limit = Number(req.query.limit) || 10;
    const explainTop = Number(req.query.explainTop) ?? 3;
    const matches = await matchMentorsForStartup(startup, mentors, {
      limit,
      explainTop,
    });
    res.json({ startup_id: startup.id, matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Mentor dashboard: AI-suggested startups */
app.get("/match/startups/:mentorId", async (req, res) => {
  try {
    const mentor =
      req.body?.mentor ??
      sample.mentors.find((m) => m.id === req.params.mentorId);
    if (!mentor) {
      return res.status(404).json({ error: "Mentor not found" });
    }
    const startups = req.body?.startups ?? sample.startups;
    const limit = Number(req.query.limit) || 10;
    const explainTop = Number(req.query.explainTop) ?? 3;
    const matches = await matchStartupsForMentor(mentor, startups, {
      limit,
      explainTop,
    });
    res.json({ mentor_id: mentor.id, matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Tiered mentor list for startup (recommended UX):
 * 1) previous_collaborations  2) ai_suggested  3) interested
 */
app.post("/match/mentors/tiered", async (req, res) => {
  try {
    const {
      startup,
      mentors,
      startup_id,
      limit,
      explainTop,
      interested_mentor_ids,
    } = req.body;
    if (!startup || !mentors?.length) {
      return res.status(400).json({ error: "startup and mentors[] required" });
    }
    const result = await getTieredMentorRecommendations(startup, mentors, {
      startup_id: startup_id ?? startup.id,
      limit: limit ?? 10,
      explainTop: explainTop ?? 3,
      interested_mentor_ids,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/match/mentors/tiered/:startupId", async (req, res) => {
  try {
    const startup =
      req.body?.startup ??
      sample.startups.find((s) => s.id === req.params.startupId);
    if (!startup) {
      return res.status(404).json({ error: "Startup not found" });
    }
    const mentors = req.body?.mentors ?? sample.mentors;
    const explainTop = Number(req.query.explainTop) ?? 3;
    const limit = Number(req.query.limit) || 10;
    const result = await getTieredMentorRecommendations(startup, mentors, {
      startup_id: req.params.startupId,
      limit,
      explainTop,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Tiered startup list for mentor (recommended UX):
 * 1) previous_collaborations  2) ai_suggested  3) interested
 */
app.post("/match/startups/tiered", async (req, res) => {
  try {
    const {
      mentor,
      startups,
      mentor_id,
      limit,
      explainTop,
      interested_startup_ids,
    } = req.body;
    if (!mentor || !startups?.length) {
      return res.status(400).json({ error: "mentor and startups[] required" });
    }
    const result = await getTieredStartupRecommendations(mentor, startups, {
      mentor_id: mentor_id ?? mentor.id,
      limit: limit ?? 10,
      explainTop: explainTop ?? 3,
      interested_startup_ids,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/match/startups/tiered/:mentorId", async (req, res) => {
  try {
    const mentor =
      req.body?.mentor ??
      sample.mentors.find((m) => m.id === req.params.mentorId);
    if (!mentor) {
      return res.status(404).json({ error: "Mentor not found" });
    }
    const startups = req.body?.startups ?? sample.startups;
    const explainTop = Number(req.query.explainTop) ?? 3;
    const limit = Number(req.query.limit) || 10;
    const result = await getTieredStartupRecommendations(mentor, startups, {
      mentor_id: req.params.mentorId,
      limit,
      explainTop,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Upload meeting minutes (send extracted text as `content`) */
app.post("/documents/meeting-minutes", async (req, res) => {
  try {
    const result = await processMeetingMinutes(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** Upload monthly report (send extracted text as `content`) */
app.post("/documents/monthly-report", async (req, res) => {
  try {
    const result = await processMonthlyReport(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/documents/startup/:startupId", (req, res) => {
  const type = req.query.type;
  res.json({
    startup_id: req.params.startupId,
    documents: listDocumentsByStartup(req.params.startupId, { type }),
  });
});

app.get("/collaborations", (req, res) => {
  res.json({ collaborations: getAllCollaborations() });
});

/** POST variants when your main app sends full profile lists (no sample IDs) */
app.post("/match/mentors", async (req, res) => {
  const { startup, mentors, limit = 10, explainTop = 3 } = req.body;
  if (!startup || !mentors?.length) {
    return res.status(400).json({ error: "startup and mentors[] required" });
  }
  const matches = await matchMentorsForStartup(startup, mentors, {
    limit,
    explainTop,
  });
  res.json({ matches });
});

app.post("/match/startups", async (req, res) => {
  const { mentor, startups, limit = 10, explainTop = 3 } = req.body;
  if (!mentor || !startups?.length) {
    return res.status(400).json({ error: "mentor and startups[] required" });
  }
  const matches = await matchStartupsForMentor(mentor, startups, {
    limit,
    explainTop,
  });
  res.json({ matches });
});

/** Single pair score (no Gemini) — fast for UI previews */
app.post("/match/score", (req, res) => {
  const { startup, mentor } = req.body;
  if (!startup || !mentor) {
    return res.status(400).json({ error: "startup and mentor required" });
  }
  const { score, breakdown } = calculateMatchScore(startup, mentor);
  res.json({
    score,
    match_percentage: score,
    match_label: `${score}%`,
    breakdown,
  });
});

/** Interest: mentor expresses interest in a startup */
app.post("/interest", (req, res) => {
  try {
    const record = addInterest(req.body);
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** Startup dashboard: mentors who clicked Interested */
app.get("/interest/startup/:startupId", (req, res) => {
  const mentorIds = getInterestedMentorIds(req.params.startupId);
  const mentors = getInterestedMentors(
    req.params.startupId,
    req.body?.mentors ?? sample.mentors
  );
  res.json({ startup_id: req.params.startupId, mentor_ids: mentorIds, mentors });
});

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "AI Backend is running",
    version: "matching-v3-tiered",
    endpoints: [
      "POST /match/mentors/tiered",
      "GET /match/mentors/tiered/:startupId",
      "POST /documents/meeting-minutes",
      "POST /documents/monthly-report",
      "GET /documents/startup/:startupId",
      "GET /collaborations",
      "POST /match/score",
      "POST /match/mentors",
      "POST /interest",
    ],
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AI backend running on http://localhost:${PORT}`);
});
