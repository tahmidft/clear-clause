import { describe, expect, it } from "vitest";
import { splitClauseText } from "@/lib/highlightClause";

describe("splitClauseText", () => {
  it("highlights money, NET terms, days, and percentages", () => {
    const text = "Pay $2,500 within 30 days under NET-45. Late fee is 5%.";
    const segments = splitClauseText(text);
    const kinds = segments.filter((s) => s.kind).map((s) => s.kind);
    expect(kinds).toContain("money");
    expect(kinds).toContain("days");
    expect(kinds).toContain("percent");
    expect(segments.some((s) => s.text.includes("$2,500"))).toBe(true);
  });

  it("highlights risky contractual phrases", () => {
    const segments = splitClauseText("Client may terminate at any time without cause.");
    expect(segments.some((s) => s.kind === "risky")).toBe(true);
  });

  it("returns a single segment for plain text", () => {
    expect(splitClauseText("No special terms here.")).toEqual([{ text: "No special terms here." }]);
  });
});
