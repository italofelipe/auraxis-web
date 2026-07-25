import { describe, expect, it } from "vitest";
import {
  APP_ORIGIN,
  buildAppUrl,
  LANDING_AI_HIGHLIGHTS,
  LANDING_FEATURES,
  LANDING_FOOTER_LINKS,
  LANDING_LOGIN_URL,
  LANDING_PAIN_POINTS,
  LANDING_REGISTER_URL,
} from "./landing-content";

describe("buildAppUrl", () => {
  it("joins a leading-slash path onto the app origin", () => {
    expect(buildAppUrl("/register")).toBe("https://app.auraxis.com.br/register");
  });

  it("normalizes paths missing the leading slash", () => {
    expect(buildAppUrl("login")).toBe("https://app.auraxis.com.br/login");
  });

  it("returns the bare origin for the root path", () => {
    expect(buildAppUrl("/")).toBe("https://app.auraxis.com.br/");
  });
});

describe("landing CTA urls", () => {
  it("points the primary CTA at the app registration page", () => {
    expect(LANDING_REGISTER_URL).toBe("https://app.auraxis.com.br/register");
  });

  it("points the discreet login link at the app login page", () => {
    expect(LANDING_LOGIN_URL).toBe("https://app.auraxis.com.br/login");
  });
});

describe("landing content catalog", () => {
  it("exposes the four v1 product features in the decided order", () => {
    expect(LANDING_FEATURES.map((feature) => feature.key)).toEqual([
      "transactions",
      "goals",
      "budgets",
      "wallet",
    ]);
  });

  it("describes every feature with a title and copy in pt-BR", () => {
    for (const feature of LANDING_FEATURES) {
      expect(feature.title.length).toBeGreaterThan(3);
      expect(feature.description.length).toBeGreaterThan(20);
    }
  });

  it("exposes the three AI differentiators (radar, chat, briefing)", () => {
    expect(LANDING_AI_HIGHLIGHTS.map((item) => item.key)).toEqual([
      "radar",
      "chat",
      "briefing",
    ]);
  });

  it("lists three concrete pain points for the problem section", () => {
    expect(LANDING_PAIN_POINTS).toHaveLength(3);
    for (const pain of LANDING_PAIN_POINTS) {
      expect(pain.length).toBeGreaterThan(20);
    }
  });

  it("keeps every footer link absolute on the app origin", () => {
    expect(LANDING_FOOTER_LINKS.length).toBeGreaterThanOrEqual(3);
    for (const link of LANDING_FOOTER_LINKS) {
      expect(link.href.startsWith(`${APP_ORIGIN}/`)).toBe(true);
      expect(link.label.length).toBeGreaterThan(2);
    }
  });

  it("includes the legal privacy and terms destinations", () => {
    const hrefs = LANDING_FOOTER_LINKS.map((link) => link.href);
    expect(hrefs).toContain("https://app.auraxis.com.br/privacy");
    expect(hrefs).toContain("https://app.auraxis.com.br/terms");
  });
});
