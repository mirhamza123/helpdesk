import { MAX_ATTACHMENTS, MAX_FILE_BYTES, ALLOWED_MIME } from "./constants";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function api<T = unknown>(url: string, method: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: json.error ?? "Something went wrong", fieldErrors: json.details };
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, error: "Network error — check your connection and try again" };
  }
}

export function validateFiles(files: File[]): string | null {
  if (files.length > MAX_ATTACHMENTS) return `You can attach up to ${MAX_ATTACHMENTS} files`;
  for (const f of files) {
    if (!ALLOWED_MIME.includes(f.type)) return `${f.name}: only PNG, JPG, WEBP, GIF or PDF files are allowed`;
    if (f.size > MAX_FILE_BYTES) return `${f.name}: files must be under 4 MB`;
  }
  return null;
}

export async function uploadFiles(files: File[]): Promise<{ urls: string[]; error?: string }> {
  const urls: string[] = [];
  for (const file of files) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd }).catch(() => null);
    if (!res) return { urls, error: `Couldn't reach the upload service for ${file.name}. Check your connection and try again.` };
    const body: unknown = await res.json().catch(() => null);
    const error = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
      ? body.error
      : `Couldn't upload ${file.name}`;
    if (!res.ok) return { urls, error };
    if (typeof body !== "object" || body === null || !("url" in body) || typeof body.url !== "string") {
      return { urls, error: "The upload service returned an invalid response. Please try again." };
    }
    urls.push(body.url);
  }
  return { urls };
}
