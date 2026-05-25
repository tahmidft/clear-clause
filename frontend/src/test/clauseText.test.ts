import { describe, expect, it } from "vitest";
import { isMeaningfulClauseText } from "@/lib/clauseText";

describe("isMeaningfulClauseText", () => {
  it("rejects empty and placeholder values", () => {
    expect(isMeaningfulClauseText("")).toBe(false);
    expect(isMeaningfulClauseText("   ")).toBe(false);
    expect(isMeaningfulClauseText("Not specified")).toBe(false);
    expect(isMeaningfulClauseText("not specified")).toBe(false);
  });

  it("accepts real clause text", () => {
    expect(isMeaningfulClauseText("Payment due within 30 days of invoice.")).toBe(true);
  });
});
