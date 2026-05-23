/** Express AI service (see /ai-backend). Default port 3001 — Next.js uses 3000. */
export const AI_BACKEND_URL =
  process.env.AI_BACKEND_URL?.replace(/\/$/, "") ?? "http://localhost:3001";

export function isAiBackendEnabled(): boolean {
  if (process.env.USE_AI_BACKEND === "false") return false;
  return (
    process.env.USE_AI_BACKEND === "true" || Boolean(process.env.AI_BACKEND_URL)
  );
}
