import { describe, expect, it } from "vitest";

import { buildWebApplicationJsonLd } from "./seo-jsonld";

describe("buildWebApplicationJsonLd", () => {
  const jsonLd = buildWebApplicationJsonLd("https://auraxis.com.br");

  it("declara AggregateOffer com a faixa real de preços (ADR #669)", () => {
    expect(jsonLd.offers).toMatchObject({
      "@type": "AggregateOffer",
      lowPrice: "0",
      highPrice: "287.04",
      priceCurrency: "BRL",
      offerCount: 3,
    });
  });

  it("lista os três planos como Offers individuais com preços canônicos", () => {
    expect(jsonLd.offers.offers.map((offer) => offer.name)).toEqual([
      "Free",
      "Premium mensal",
      "Premium anual",
    ]);
    expect(jsonLd.offers.offers.map((offer) => offer.price)).toEqual(["0", "29.90", "287.04"]);
    expect(new Set(jsonLd.offers.offers.map((offer) => offer.priceCurrency))).toEqual(
      new Set(["BRL"]),
    );
  });

  it("normaliza a siteUrl removendo barra final", () => {
    expect(jsonLd.url).toBe("https://auraxis.com.br");
    expect(buildWebApplicationJsonLd("https://auraxis.com.br/").url).toBe(
      "https://auraxis.com.br",
    );
  });

  it("mantém a identidade WebApplication e o publisher", () => {
    expect(jsonLd["@type"]).toBe("WebApplication");
    expect(jsonLd.publisher).toMatchObject({
      "@type": "Organization",
      name: "Auraxis",
      url: "https://auraxis.com.br",
    });
  });
});
