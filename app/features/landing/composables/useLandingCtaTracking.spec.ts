import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  planSlugFromDestination,
  useLandingCtaTracking,
} from "./useLandingCtaTracking";

const captureMock = vi.hoisted(() => vi.fn());

interface AnalyticsClientMock {
  capture: typeof captureMock;
  identify: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
}

vi.mock("~/composables/useAnalytics/useAnalytics", () => ({
  useAnalytics: (): AnalyticsClientMock => ({
    capture: captureMock,
    identify: vi.fn(),
    reset: vi.fn(),
  }),
}));

describe("planSlugFromDestination", () => {
  it("extrai o plano de um path relativo", () => {
    expect(planSlugFromDestination("/checkout?plano=anual")).toBe("anual");
  });

  it("extrai o plano de uma URL absoluta", () => {
    expect(planSlugFromDestination("https://auraxis.com.br/checkout?plano=mensal")).toBe("mensal");
  });

  it("retorna null quando não há query de plano", () => {
    expect(planSlugFromDestination("https://app.auraxis.com.br/register")).toBeNull();
  });
});

describe("useLandingCtaTracking", () => {
  beforeEach(() => {
    captureMock.mockClear();
  });

  it("captura landing_cta_clicked com source e destination", () => {
    const { trackCta } = useLandingCtaTracking();

    trackCta("hero-register", "https://app.auraxis.com.br/register");

    expect(captureMock).toHaveBeenCalledTimes(1);
    expect(captureMock).toHaveBeenCalledWith("landing_cta_clicked", {
      source: "hero-register",
      destination: "https://app.auraxis.com.br/register",
    });
  });

  it("no CTA de assinatura também emite upgrade_clicked com o plano (contrato #524)", () => {
    const { trackCta } = useLandingCtaTracking();

    trackCta("pricing-subscribe", "/checkout?plano=anual");

    expect(captureMock).toHaveBeenCalledTimes(2);
    expect(captureMock).toHaveBeenNthCalledWith(1, "landing_cta_clicked", {
      source: "pricing-subscribe",
      destination: "/checkout?plano=anual",
    });
    expect(captureMock).toHaveBeenNthCalledWith(2, "upgrade_clicked", {
      source: "landing-pricing",
      destination: "/checkout?plano=anual",
      plan_slug: "anual",
    });
  });

  it("CTAs que não são de assinatura não emitem upgrade_clicked", () => {
    const { trackCta } = useLandingCtaTracking();

    trackCta("final-cta", "https://app.auraxis.com.br/register");

    expect(captureMock).toHaveBeenCalledTimes(1);
  });
});
