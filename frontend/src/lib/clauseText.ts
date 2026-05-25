/** True when clause text should be shown in the UI (non-empty, not a placeholder). */
export function isMeaningfulClauseText(text: string | null | undefined): boolean {
  const trimmed = text?.trim();
  if (!trimmed) return false;
  return !/^not specified$/i.test(trimmed);
}
