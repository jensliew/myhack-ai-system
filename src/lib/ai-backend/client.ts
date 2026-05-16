import { AI_BACKEND_URL } from "./config";

export class AiBackendError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AiBackendError";
  }
}

export async function aiBackendFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${AI_BACKEND_URL}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      (body as { error?: string }).error ??
      `AI backend error (${response.status})`;
    throw new AiBackendError(message, response.status);
  }

  return response.json() as Promise<T>;
}
