/**
 * Analyze mentor–startup engagement from meeting minutes text (rule-based).
 */
export async function analyzeMeetingMinutes({
  content,
  startup_id,
  mentor_id,
  title,
  period,
}) {
  // Rule-based analysis of meeting minutes
  const contentLower = (content || "").toLowerCase();
  
  // Calculate engagement score based on content analysis
  let engagementScore = 50; // baseline
  
  // Check for positive indicators
  if (contentLower.includes("action item") || contentLower.includes("next step")) engagementScore += 10;
  if (contentLower.includes("goal") || contentLower.includes("milestone")) engagementScore += 10;
  if (contentLower.includes("feedback") || contentLower.includes("advice")) engagementScore += 10;
  if (contentLower.includes("progress") || contentLower.includes("update")) engagementScore += 5;
  if (contentLower.includes("challenge") || contentLower.includes("issue")) engagementScore += 5;
  
  // Determine interaction quality
  let interactionQuality = "medium";
  if (engagementScore >= 80) interactionQuality = "high";
  if (engagementScore <= 40) interactionQuality = "low";
  
  // Extract key topics (simple keyword matching)
  const keyTopics = [];
  const keywords = ["product", "market", "funding", "team", "strategy", "growth", "technology", "customer"];
  keywords.forEach(kw => {
    if (contentLower.includes(kw)) keyTopics.push(kw.charAt(0).toUpperCase() + kw.slice(1));
  });
  
  return {
    engagement_score: Math.min(engagementScore, 100),
    interaction_quality: interactionQuality,
    mentor_participation: "Mentor provided guidance and feedback",
    startup_engagement: "Startup actively participated and discussed progress",
    key_topics: keyTopics.length > 0 ? keyTopics : ["General mentorship"],
    action_items: ["Continue regular meetings", "Track progress on discussed items"],
    summary: `Meeting between mentor and startup covered key topics including ${keyTopics.slice(0, 2).join(" and ") || "business strategy"}. Engagement level: ${interactionQuality}.`
  };
}
