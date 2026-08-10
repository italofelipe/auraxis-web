import { describe, expect, it } from "vitest";
import { buildToolAlternateLinks } from "./useToolPageStructuredData";

describe("buildToolAlternateLinks", () => {
  it("builds reciprocal pt-BR/en alternates with pt-BR as x-default", () => {
    expect(buildToolAlternateLinks("https://auraxis.com.br", "juros-compostos")).toEqual([
      {
        rel: "alternate",
        type: "text/html",
        hreflang: "pt-BR",
        href: "https://auraxis.com.br/tools/juros-compostos",
      },
      {
        rel: "alternate",
        type: "text/html",
        hreflang: "en",
        href: "https://auraxis.com.br/en/tools/juros-compostos",
      },
      {
        rel: "alternate",
        type: "text/html",
        hreflang: "x-default",
        href: "https://auraxis.com.br/tools/juros-compostos",
      },
    ]);
  });

  it("normalizes a trailing slash on the base URL", () => {
    const links = buildToolAlternateLinks("https://auraxis.com.br/", "fire");
    expect(links[0]?.href).toBe("https://auraxis.com.br/tools/fire");
  });
});
