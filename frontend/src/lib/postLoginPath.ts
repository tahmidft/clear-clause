import { getPreferences } from "@/lib/api";

/** Dashboard when preferences exist; otherwise onboarding. Falls back on ALL API errors. */
export async function resolvePostLoginPath(fallback = "/dashboard"): Promise<string> {
  try {
    const prefs = await getPreferences();
    return prefs ? fallback : "/onboarding";
  } catch {
    // Any error (DB down, 500, timeout, network) → go straight to dashboard.
    return fallback;
  }
}
