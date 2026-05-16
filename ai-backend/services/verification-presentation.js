const STATUS_MAP = {
  APPROVE: {
    ai_recommendation: "Approve",
    badge_variant: "approve",
  },
  PENDING: {
    ai_recommendation: "Pending Review",
    badge_variant: "pending",
  },
  REJECT: {
    ai_recommendation: "Reject",
    badge_variant: "reject",
  },
};

function formatExpertiseList(expertise) {
  if (!expertise) return "";
  const list = Array.isArray(expertise)
    ? expertise
    : String(expertise)
        .split(/[,;|]/)
        .map((s) => s.trim())
        .filter(Boolean);
  return list.join(", ");
}

/** Fallback industry line when Gemini is skipped or fails. */
export function buildIndustrySummary(role, profile) {
  if (role === "startup") {
    const industry = profile?.industry?.trim();
    return industry ? `Industry: ${industry}.` : "Industry: Not specified.";
  }

  const expertise = formatExpertiseList(profile?.expertise);
  const exp = String(profile?.experience ?? "").trim();
  if (expertise && exp) {
    return `Industry: ${expertise} (based on experience: ${exp.slice(0, 80)}).`;
  }
  if (expertise) return `Industry: ${expertise}.`;
  if (exp) return `Industry: Inferred from experience — ${exp.slice(0, 80)}.`;
  return "Industry: Not specified.";
}

export function buildFallbackReasoning(recommendation, missing_info, role) {
  const missing = Array.isArray(missing_info) ? missing_info : [];
  if (recommendation === "REJECT") {
    return `The ${role} application did not meet verification standards. ${
      missing.length
        ? `Issues include: ${missing.slice(0, 3).join("; ")}.`
        : "Profile quality or consistency checks failed."
    }`;
  }
  if (recommendation === "PENDING") {
    return `All required form fields are present, but review is needed before approval. ${
      missing.length
        ? `Outstanding items: ${missing.slice(0, 4).join("; ")}.`
        : "Additional verification or clearer profile details are recommended."
    }`;
  }
  return `The ${role} profile meets program requirements and is recommended for approval.`;
}

/**
 * Nexora admin registration card shape (mentor + startup).
 */
export function formatVerificationCard({
  role,
  profile = {},
  recommendation,
  ai_scores,
  final_score,
  confidence,
  missing_info,
  improvement_suggestions,
  ai_reasoning,
  industry_summary,
}) {
  const status = STATUS_MAP[recommendation] ?? STATUS_MAP.PENDING;

  return {
    email: profile.email ?? null,
    entity_id: profile.entity_id ?? profile.id ?? null,
    role,

    ai_recommendation: status.ai_recommendation,
    ai_recommendation_code: recommendation,
    badge_variant: status.badge_variant,

    ai_reasoning:
      ai_reasoning ??
      buildFallbackReasoning(recommendation, missing_info, role),
    industry_summary:
      industry_summary ?? buildIndustrySummary(role, profile),

    improvement_suggestions: improvement_suggestions ?? null,

    recommendation,
    final_score,
    confidence,
    missing_info: missing_info ?? [],
    ai_scores: ai_scores ?? null,
  };
}
