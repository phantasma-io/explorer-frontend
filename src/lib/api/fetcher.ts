import { getExplorerConfig } from "@/lib/config";

const isAbsoluteUrl = (url: string) =>
  url.startsWith("http://") || url.startsWith("https://");

async function resolveApiUrl(url: string): Promise<string> {
  if (isAbsoluteUrl(url)) return url;
  const config = await getExplorerConfig();
  const base = config.apiBaseUrl.replace(/\/+$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}

// Attach HTTP status to errors so UI can distinguish "not found" from other failures.
export class ApiError extends Error {
  status: number;
  url: string;

  constructor(message: string, status: number, url: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
  }
}

export const isNotFoundError = (error: unknown): error is ApiError =>
  error instanceof ApiError && error.status === 404;

export async function fetchJson<T>(url: string, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const endpoint = await resolveApiUrl(url);
    const response = await fetch(endpoint, { signal: controller.signal });
    if (!response.ok) {
      throw new ApiError(`Request failed (${response.status})`, response.status, endpoint);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function postJson<T>(
  url: string,
  body: unknown,
  timeoutMs = 15000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const endpoint = await resolveApiUrl(url);
    // Use JSON POST for instruction decoding and other stateful endpoints.
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ApiError(`Request failed (${response.status})`, response.status, endpoint);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
