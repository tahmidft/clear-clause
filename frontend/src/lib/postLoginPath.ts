import { getPreferences } from "@/lib/api";

/** Dashboard when preferences exist; otherwise onboarding. Falls back on API errors. */
export async function resolvePostLoginPath(fallback = "/dashboard"): Promise<string> {
  try {
    const prefs = await getPreferences();
    return prefs ? fallback : "/onboarding";
  } catch {
    return fallback;
  }
}
