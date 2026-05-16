/**
 * Generate detailed reasoning for a startup-mentor match using rule-based analysis
 * (No Gemini API calls - works immediately without quota issues)
 * 
 * @param {Object} startup - The startup being evaluated
 * @param {Object} mentor - The mentor being evaluated
 * @param {Object} options - { score, breakdown, isMentorView }
 */
export async function explainMatch(startup, mentor, { score, breakdown, isMentorView = false } = {}) {
  if (isMentorView) {
    return buildMentorFocusedReasoning(startup, mentor, score, breakdown);
  }
  return buildDetailedReasoning(startup, mentor, score, breakdown);
}

function buildDetailedReasoning(startup, mentor, score, breakdown) {
  const mentorName = mentor.name || mentor.full_name || "This mentor";
  const startupName = startup.name || "your startup";
  const mentorExpertise = Array.isArray(mentor.expertise) ? mentor.expertise : [];
  const startupGoals = Array.isArray(startup.goals) ? startup.goals : [];
  const startupIndustry = startup.industry || "";
  
  // Analyze the match breakdown to provide specific reasoning
  let reasoning = "";
  const reasons = [];
  
  // Check what factors contributed to the score
  if (breakdown && Array.isArray(breakdown)) {
    breakdown.forEach(item => {
      if (item.factor === "industry_expertise") {
        reasons.push(`${mentorName}'s expertise in ${mentorExpertise.slice(0, 2).join(", ")} directly matches ${startupName}'s ${startupIndustry} focus`);
      }
      if (item.factor === "goals_expertise") {
        const matchingGoals = startupGoals.filter(goal => 
          mentorExpertise.some(exp => goal.toLowerCase().includes(exp.toLowerCase()))
        );
        if (matchingGoals.length > 0) {
          reasons.push(`Their expertise aligns with your goal to ${matchingGoals[0]}`);
        }
      }
      if (item.factor === "stage_bio") {
        reasons.push(`${mentorName} has specific experience mentoring startups at the ${startup.stage} stage`);
      }
      if (item.factor === "experience_years") {
        reasons.push(`${mentorName} brings extensive experience to guide ${startupName}`);
      }
      if (item.factor === "funding_expertise") {
        reasons.push(`Their fundraising expertise is valuable for ${startupName}'s growth plans`);
      }
    });
  }
  
  // Build the reasoning from matched factors
  if (reasons.length > 0) {
    reasoning = reasons.slice(0, 2).join(". ") + ".";
  } else {
    // Fallback if no specific factors matched
    if (mentorExpertise.length > 0 && startupGoals.length > 0) {
      reasoning = `${mentorName}'s expertise in ${mentorExpertise.slice(0, 2).join(", ")} can support ${startupName}'s goal to ${startupGoals[0]}.`;
    } else if (mentorExpertise.length > 0) {
      reasoning = `${mentorName} brings ${mentorExpertise.slice(0, 2).join(", ")} expertise to support ${startupName}'s growth.`;
    } else {
      reasoning = `${mentorName} has relevant experience to mentor ${startupName}.`;
    }
  }
  
  return {
    reason: `${score}% match`,
    ai_match_reasoning: reasoning,
    strengths: mentorExpertise.slice(0, 3),
    weaknesses: [],
    suggestion: null,
  };
}

export async function enrichTopMatches(
  startup,
  rankedMentors,
  { explainCount = 3 } = {}
) {
  const top = rankedMentors.slice(0, explainCount);
  const rest = rankedMentors.slice(explainCount);

  const enriched = await Promise.all(
    top.map(async (item) => {
      const explanation = await explainMatch(startup, item.mentor, {
        score: item.score,
        breakdown: item.breakdown,
      });
      return { ...item, ...explanation };
    })
  );

  return [...enriched, ...rest];
}

/**
 * Generate mentor-focused reasoning for startup matches
 * Shows why this startup is a good fit for the mentor's expertise
 */
function buildMentorFocusedReasoning(startup, mentor, score, breakdown) {
  const startupName = startup.name || "this startup";
  const mentorExpertise = Array.isArray(mentor.expertise) ? mentor.expertise : [];
  const startupGoals = Array.isArray(startup.goals) ? startup.goals : [];
  const startupIndustry = startup.industry || "";
  const startupStage = startup.stage || "";
  
  const reasons = [];
  
  // Build detailed reasoning based on multiple factors
  if (breakdown && Array.isArray(breakdown)) {
    breakdown.forEach(item => {
      if (item.factor === "industry_expertise" && mentorExpertise.length > 0) {
        reasons.push(`${startupName} operates in ${startupIndustry} and needs expertise in ${mentorExpertise.slice(0, 2).join(", ")}`);
      }
      if (item.factor === "goals_expertise" && startupGoals.length > 0) {
        reasons.push(`${startupName} is focused on ${startupGoals.slice(0, 2).join(", ")}, which aligns with your ${mentorExpertise[0]} background`);
      }
      if (item.factor === "stage_bio" && startupStage) {
        reasons.push(`You have proven experience mentoring ${startupStage}-stage startups like ${startupName}`);
      }
      if (item.factor === "experience_years") {
        reasons.push(`Your extensive experience can accelerate ${startupName}'s growth trajectory`);
      }
      if (item.factor === "funding_expertise") {
        reasons.push(`${startupName} can benefit from your fundraising and investor network expertise`);
      }
    });
  }
  
  // Build final reasoning - combine top 2 reasons or use fallback
  let reasoning = "";
  if (reasons.length >= 2) {
    reasoning = reasons.slice(0, 2).join(". ") + ".";
  } else if (reasons.length === 1) {
    reasoning = reasons[0] + ".";
  } else {
    // Fallback with more detail
    if (mentorExpertise.length > 0 && startupGoals.length > 0) {
      reasoning = `${startupName} needs ${mentorExpertise.slice(0, 2).join(", ")} expertise to achieve ${startupGoals[0]}, which matches your background.`;
    } else if (mentorExpertise.length > 0) {
      reasoning = `Your expertise in ${mentorExpertise.slice(0, 2).join(", ")} is valuable for ${startupName}'s ${startupIndustry} focus.`;
    } else {
      reasoning = `${startupName} is a good fit for your mentorship experience.`;
    }
  }
  
  return {
    reason: `${score}% match`,
    ai_match_reasoning: reasoning,
    strengths: mentorExpertise.slice(0, 3),
    weaknesses: [],
    suggestion: null,
  };
}

export async function enrichTopStartupMatches(
  mentor,
  rankedStartups,
  { explainCount = 3 } = {}
) {
  const top = rankedStartups.slice(0, explainCount);
  const rest = rankedStartups.slice(explainCount);

  const enriched = await Promise.all(
    top.map(async (item) => {
      const explanation = await explainMatch(item.startup, mentor, {
        score: item.score,
        breakdown: item.breakdown,
        isMentorView: true,
      });
      return { ...item, ...explanation };
    })
  );

  return [...enriched, ...rest];
}
