import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import EmailConfirmationBanner from "../EmailConfirmationBanner.vue";

// ── Stubs ────────────────────────────────────────────────────────────────────

const sessionMock = {
  isAuthenticated: false as boolean,
  emailVerified: false as boolean,
  daysUntilEmailRequired: null as number | null,
};

vi.mock("~/stores/session", () => ({
  useSessionStore: (): typeof sessionMock => sessionMock,
}));

const tMock = vi.fn(
  (key: string, params?: Record<string, unknown>, count?: number) => {
    const days = (params?.count as number | undefined) ?? count ?? 0;
    if (key === "auth.emailBanner.expired") {
      return "EXPIRED";
    }
    if (key === "auth.emailBanner.urgent") {
      return `URGENT-${days}`;
    }
    if (key === "auth.emailBanner.countdown") {
      return `COUNTDOWN-${days}`;
    }
    if (key === "auth.emailBanner.message") {
      return "MESSAGE";
    }
    if (key === "auth.emailBanner.cta") {
      return "CTA";
    }
    return key;
  },
);

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: typeof tMock } => ({ t: tMock }),
}));

vi.mock("naive-ui", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = await importOriginal<any>();
  return {
    ...actual,
    NButton: {
      name: "NButton",
      template: "<button><slot /></button>",
      props: ["href", "size", "type", "tag"],
    },
  };
});

describe("EmailConfirmationBanner", () => {
  it("does not render when user is not authenticated", () => {
    sessionMock.isAuthenticated = false;
    sessionMock.emailVerified = false;
    sessionMock.daysUntilEmailRequired = 10;
    const wrapper = mount(EmailConfirmationBanner);
    expect(
      wrapper.find("[data-testid='email-confirmation-banner']").exists(),
    ).toBe(false);
  });

  it("does not render when email is already verified", () => {
    sessionMock.isAuthenticated = true;
    sessionMock.emailVerified = true;
    sessionMock.daysUntilEmailRequired = null;
    const wrapper = mount(EmailConfirmationBanner);
    expect(
      wrapper.find("[data-testid='email-confirmation-banner']").exists(),
    ).toBe(false);
  });

  it("renders the info variant for 8+ days remaining", () => {
    sessionMock.isAuthenticated = true;
    sessionMock.emailVerified = false;
    sessionMock.daysUntilEmailRequired = 10;
    const wrapper = mount(EmailConfirmationBanner);
    const banner = wrapper.find("[data-testid='email-confirmation-banner']");
    expect(banner.exists()).toBe(true);
    expect(banner.attributes("data-variant")).toBe("info");
    expect(banner.text()).toContain("COUNTDOWN-10");
  });

  it("renders the urgent variant for 1–7 days remaining", () => {
    sessionMock.isAuthenticated = true;
    sessionMock.emailVerified = false;
    sessionMock.daysUntilEmailRequired = 3;
    const wrapper = mount(EmailConfirmationBanner);
    const banner = wrapper.find("[data-testid='email-confirmation-banner']");
    expect(banner.attributes("data-variant")).toBe("urgent");
    expect(banner.text()).toContain("URGENT-3");
  });

  it("renders the expired variant for 0 or negative days", () => {
    sessionMock.isAuthenticated = true;
    sessionMock.emailVerified = false;
    sessionMock.daysUntilEmailRequired = 0;
    const wrapper = mount(EmailConfirmationBanner);
    const banner = wrapper.find("[data-testid='email-confirmation-banner']");
    expect(banner.attributes("data-variant")).toBe("expired");
    expect(banner.text()).toContain("EXPIRED");
  });

  it("renders the expired variant for negative days remaining", () => {
    sessionMock.isAuthenticated = true;
    sessionMock.emailVerified = false;
    sessionMock.daysUntilEmailRequired = -2;
    const wrapper = mount(EmailConfirmationBanner);
    expect(
      wrapper
        .find("[data-testid='email-confirmation-banner']")
        .attributes("data-variant"),
    ).toBe("expired");
  });

  it("falls back to the legacy message when daysUntilEmailRequired is null", () => {
    sessionMock.isAuthenticated = true;
    sessionMock.emailVerified = false;
    sessionMock.daysUntilEmailRequired = null;
    const wrapper = mount(EmailConfirmationBanner);
    const banner = wrapper.find("[data-testid='email-confirmation-banner']");
    expect(banner.attributes("data-variant")).toBe("info");
    expect(banner.text()).toContain("MESSAGE");
  });

  it("has role=alert for accessibility", () => {
    sessionMock.isAuthenticated = true;
    sessionMock.emailVerified = false;
    sessionMock.daysUntilEmailRequired = 5;
    const wrapper = mount(EmailConfirmationBanner);
    expect(
      wrapper
        .find("[data-testid='email-confirmation-banner']")
        .attributes("role"),
    ).toBe("alert");
  });
});
