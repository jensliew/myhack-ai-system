import { callGemini } from "../services/gemini.js";

/**
 * Analyze mentor–startup engagement from meeting minutes using Gemini API.
 * Falls back to rule-based if API call fails.
 */
export async function analyzeMeetingMinutes({
  content,
  startup_id,
  mentor_id,
  title,
  period,
}) {
  const prompt = `You are an AI analyst for a startup accelerator program. Analyze these meeting minutes between a mentor and startup, then return a JSON object.

Meeting Title: ${title || "Mentor-Startup Meeting"}
Period: ${period || "Not specified"}
Content:
${content || "No content provided"}

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "engagement_score": <number 0-100 based on quality of discussion, action items, and participation>,
  "interaction_quality": "<low|medium|high>",
  "mentor_name": "<extract the mentor's full name from the attendees or content, or null if not found>",
  "mentor_participation": "<one sentence about mentor's specific contributions in this meeting>",
  "startup_engagement": "<one sentence about startup's engagement level in this meeting>",
  "key_topics": ["<topic1>", "<topic2>", "<topic3>"],
  "action_items": ["<action1>", "<action2>"],
  "summary": "<2-sentence personalised summary referencing the actual startup name, mentor name, and specific topics discussed>"
}

Scoring guide for engagement_score:
- 80-100: Rich discussion, clear action items, strong participation from both sides
- 60-79: Good meeting with some action items and decent participation
- 40-59: Average meeting, limited action items
- 0-39: Poor engagement, minimal discussion`;

  try {
    const raw = await callGemini(prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("Gemini meeting minutes analysis failed, using fallback:", err.message);
    // Rule-based fallback
    const contentLower = (content || "").toLowerCase();
    let engagementScore = 50;
    if (contentLower.includes("action item") || contentLower.includes("next step")) engagementScore += 10;
    if (contentLower.includes("goal") || contentLower.includes("milestone")) engagementScore += 10;
    if (contentLower.includes("feedback") || contentLower.includes("advice")) engagementScore += 10;
    if (contentLower.includes("progress") || contentLower.includes("update")) engagementScore += 5;
    if (contentLower.includes("challenge") || contentLower.includes("issue")) engagementScore += 5;

    let interactionQuality = "medium";
    if (engagementScore >= 80) interactionQuality = "high";
    if (engagementScore <= 40) interactionQuality = "low";

    const keyTopics = [];
    ["product", "market", "funding", "team", "strategy", "growth", "technology", "customer"]
      .forEach(kw => { if (contentLower.includes(kw)) keyTopics.push(kw.charAt(0).toUpperCase() + kw.slice(1)); });

    return {
      engagement_score: Math.min(engagementScore, 100),
      interaction_quality: interactionQuality,
      mentor_participation: "Mentor provided guidance and feedback",
      startup_engagement: "Startup actively participated and discussed progress",
      key_topics: keyTopics.length > 0 ? keyTopics : ["General mentorship"],
      action_items: ["Continue regular meetings", "Track progress on discussed items"],
      summary: `Meeting covered ${keyTopics.slice(0, 2).join(" and ") || "business strategy"}. Engagement level: ${interactionQuality}.`
    };
  }
}
