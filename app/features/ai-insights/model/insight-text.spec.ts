import { describe, expect, it } from "vitest";

import {
  estimateReadingMinutes,
  parseInlineEmphasis,
  splitParagraphs,
} from "./insight-text";
import type { InsightItem } from "~/features/ai-insights/contracts/ai-insight";

/**
 * Builds a minimal insight item for reading-time tests.
 *
 * @param title Item title.
 * @param message Item message.
 * @returns Insight item fixture.
 */
const makeItem = (title: string, message: string): InsightItem => ({
  type: "saude_financeira",
  dimension: "transactions",
  title,
  message,
});

describe("estimateReadingMinutes", () => {
  it("returns 0 for empty input", () => {
    expect(estimateReadingMinutes([])).toBe(0);
  });

  it("rounds to at least 1 minute for short content", () => {
    expect(estimateReadingMinutes([makeItem("Oi", "poucas palavras aqui")])).toBe(1);
  });

  it("scales with word count (~200 wpm)", () => {
    const longMessage = Array.from({ length: 600 }, () => "palavra").join(" ");
    expect(estimateReadingMinutes([makeItem("Título", longMessage)])).toBe(3);
  });
});

describe("splitParagraphs", () => {
  it("splits on blank lines and trims", () => {
    expect(splitParagraphs("Primeiro parágrafo.\n\nSegundo parágrafo.")).toEqual([
      "Primeiro parágrafo.",
      "Segundo parágrafo.",
    ]);
  });

  it("returns a single paragraph when there are no blank lines", () => {
    expect(splitParagraphs("Texto único")).toEqual(["Texto único"]);
  });

  it("drops empty paragraphs", () => {
    expect(splitParagraphs("A\n\n\n\nB")).toEqual(["A", "B"]);
  });
});

describe("parseInlineEmphasis", () => {
  it("splits bold spans from plain text", () => {
    expect(parseInlineEmphasis("Saldo de **R$ 1.000** hoje")).toEqual([
      { text: "Saldo de ", bold: false },
      { text: "R$ 1.000", bold: true },
      { text: " hoje", bold: false },
    ]);
  });

  it("returns a single plain segment when there is no emphasis", () => {
    expect(parseInlineEmphasis("sem destaque")).toEqual([
      { text: "sem destaque", bold: false },
    ]);
  });

  it("handles multiple bold spans", () => {
    const segments = parseInlineEmphasis("**a** e **b**");
    expect(segments.filter((s) => s.bold).map((s) => s.text)).toEqual(["a", "b"]);
  });
});
