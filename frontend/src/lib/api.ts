import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { Analysis, Contract, Preference, PreferenceRecord } from "@/types";

function devApiProxyEnabled(): boolean {
  return (
    import.meta.env.DEV &&
    import.meta.env.MODE !== "test" &&
    import.meta.env.VITE_DEV_API_PROXY !== "false"
  );
}

/** Same-origin `/api/...` in local dev (Vite proxy), or absolute `VITE_API_URL` elsewhere. */
function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (devApiProxyEnabled()) {
    return `/api${p}`;
  }
  const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  if (!base) {
    throw new ApiError("The app is not configured with an API URL.", 500);
  }
  return `${base}${p}`;
}

/** True when the app can issue API requests (dev proxy or configured base URL). */
export function isApiConfigured(): boolean {
  if (devApiProxyEnabled()) {
    return true;
  }
  return !!(import.meta.env.VITE_API_URL ?? "").trim();
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function friendlyMessage(status: number, isNetwork: boolean): string {
  if (isNetwork) {
    return "We could not reach the server. Check your connection or try again shortly.";
  }
  if (status === 401 || status === 403) {
    return "Your session has expired. Please sign in again.";
  }
  if (status === 404) {
    return "We could not find what you were looking for.";
  }
  if (status === 413 || status === 400) {
    return "This file could not be uploaded. Check the format and size (max 10 MB).";
  }
  if (status >= 500) {
    return "Something went wrong on our side. Please try again in a moment.";
  }
  return "Something went wrong. Please try again.";
}

async function readFastApiErrorDetail(res: Response): Promise<string | undefined> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("json")) return undefined;
  try {
    const data = (await res.json()) as { detail?: unknown };
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item) => {
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg: string }).msg);
          }
          return JSON.stringify(item);
        })
        .join(" ");
    }
  } catch {
    return undefined;
  }
  return undefined;
}

async function errorDescriptionFromResponse(res: Response): Promise<string> {
  const detail = (await readFastApiErrorDetail(res))?.trim();
  if (detail) return detail;
  return friendlyMessage(res.status, false);
}

async function authHeaders(): Promise<HeadersInit> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new ApiError("You need to be signed in to continue.", 401);
  }
  return {
    Authorization: `Bearer ${data.session.access_token}`,
  };
}

const DEFAULT_TIMEOUT_MS = 15_000;
const ANALYSIS_TIMEOUT_MS = 120_000;

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  options: { skipErrorToast?: boolean; signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<T> {
  const retries = (init.method ?? "GET").toUpperCase() === "GET" ? 2 : 0;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let attempt = 0;
  let res: Response | null = null;
  while (attempt <= retries) {
    const timeout = new AbortController();
    const timer = window.setTimeout(() => timeout.abort(), timeoutMs);
    try {
      const headers = new Headers(init.headers);
      if (!headers.has("Authorization") && !path.endsWith("/health")) {
        const auth = await authHeaders();
        Object.entries(auth).forEach(([k, v]) => headers.set(k, String(v)));
      }
      res = await fetch(apiUrl(path), {
        ...init,
        headers,
        signal: options.signal ?? timeout.signal,
      });
      window.clearTimeout(timer);
      break;
    } catch (err) {
      window.clearTimeout(timer);
      if (attempt === retries) {
        const aborted = err instanceof DOMException && err.name === "AbortError";
        const description = aborted
          ? "The request took too long. Contract analysis can take up to a minute — try again."
          : friendlyMessage(0, true);
        if (!options.skipErrorToast) {
          toast({
            title: aborted ? "Request timed out" : "Connection issue",
            description,
            variant: "destructive",
          });
        }
        throw new ApiError(description, 0);
      }
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      attempt += 1;
    }
  }
  if (!res) {
    throw new ApiError(friendlyMessage(0, true), 0);
  }

  if (res.status === 401 || res.status === 403) {
    await supabase.auth.signOut();
    if (!options.skipErrorToast) {
      toast({
        title: "Session ended",
        description: friendlyMessage(res.status, false),
        variant: "destructive",
      });
    }
    throw new ApiError(friendlyMessage(res.status, false), res.status);
  }

  if (!res.ok) {
    const description = await errorDescriptionFromResponse(res);
    if (!options.skipErrorToast) {
      if (res.status >= 500) {
        toast({
          title: res.status === 503 ? "Service unavailable" : "Server error",
          description,
          variant: "destructive",
        });
      } else if (res.status >= 400 && res.status !== 404) {
        toast({ title: "Request failed", description, variant: "destructive" });
      }
    }
    throw new ApiError(description, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export async function uploadContract(file: File): Promise<Contract> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new ApiError("You need to be signed in to continue.", 401);
  }
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(apiUrl("/contracts/upload"), {
    method: "POST",
    headers: { Authorization: `Bearer ${data.session.access_token}` },
    body: fd,
  });
  if (res.status === 401 || res.status === 403) {
    await supabase.auth.signOut();
    toast({
      title: "Session ended",
      description: friendlyMessage(res.status, false),
      variant: "destructive",
    });
    throw new ApiError(friendlyMessage(res.status, false), res.status);
  }
  if (!res.ok) {
    const description = await errorDescriptionFromResponse(res);
    toast({
      title: "Upload failed",
      description,
      variant: "destructive",
    });
    throw new ApiError(description, res.status);
  }
  const json = (await res.json()) as Contract;
  return json;
}

export async function getContracts(): Promise<Contract[]> {
  return requestJson<Contract[]>("/contracts", { method: "GET" });
}

export async function deleteContract(id: string): Promise<void> {
  await requestJson<void>(`/contracts/${id}`, { method: "DELETE" });
}

export async function analyzeContract(contractId: string): Promise<Analysis> {
  return requestJson<Analysis>(
    `/analysis/${contractId}`,
    { method: "POST" },
    { timeoutMs: ANALYSIS_TIMEOUT_MS },
  );
}

export async function getAnalysis(contractId: string): Promise<Analysis | null> {
  try {
    return await requestJson<Analysis>(`/analysis/${contractId}`, { method: "GET" }, { skipErrorToast: true });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      return null;
    }
    throw e;
  }
}

export async function savePreferences(prefs: Preference): Promise<PreferenceRecord> {
  return requestJson<PreferenceRecord>("/preferences", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
  });
}

export async function getPreferences(): Promise<PreferenceRecord | null> {
  try {
    return await requestJson<PreferenceRecord>("/preferences", { method: "GET" }, { skipErrorToast: true });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      return null;
    }
    throw e;
  }
}

export async function pingHealth(signal?: AbortSignal): Promise<void> {
  if (!isApiConfigured()) {
    throw new Error("No API URL");
  }
  const res = await fetch(apiUrl("/health"), { method: "GET", signal });
  if (!res.ok) {
    throw new Error("Health check failed");
  }
}
