import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import EmailConfirmationBanner from "../EmailConfirmationBanner.vue";

// ── Stubs ────────────────────────────────────────────────────────────────────

const sessionMock = {
  isAuthenticated: false as boolean,
  emailConfirmed: null as boolean | null,
};

vi.mock("~/stores/session", () => ({
  useSessionStore: (): typeof sessionMock => sessionMock,
}));

vi.mock("naive-ui", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = await importOriginal<any>();
  return {
    ...actual,
    NButton: { name: "NButton", template: "<button><slot /></button>", props: ["href", "size", "type", "tag"] },
  };
});

describe("EmailConfirmationBanner", () => {
  it("does not render when user is not authenticated", () => {
    sessionMock.isAuthenticated = false;
    sessionMock.emailConfirmed = false;
    const wrapper = mount(EmailConfirmationBanner);
    expect(wrapper.find("[data-testid='email-confirmation-banner']").exists()).toBe(false);
  });

  it("does not render when email is already confirmed", () => {
    sessionMock.isAuthenticated = true;
    sessionMock.emailConfirmed = true;
    const wrapper = mount(EmailConfirmationBanner);
    expect(wrapper.find("[data-testid='email-confirmation-banner']").exists()).toBe(false);
  });

  it("does not render when emailConfirmed is null (unknown state)", () => {
    sessionMock.isAuthenticated = true;
    sessionMock.emailConfirmed = null;
    const wrapper = mount(EmailConfirmationBanner);
    expect(wrapper.find("[data-testid='email-confirmation-banner']").exists()).toBe(false);
  });

  it("renders banner when authenticated and email is not confirmed", () => {
    sessionMock.isAuthenticated = true;
    sessionMock.emailConfirmed = false;
    const wrapper = mount(EmailConfirmationBanner);
    expect(wrapper.find("[data-testid='email-confirmation-banner']").exists()).toBe(true);
  });

  it("has correct role attribute for accessibility", () => {
    sessionMock.isAuthenticated = true;
    sessionMock.emailConfirmed = false;
    const wrapper = mount(EmailConfirmationBanner);
    expect(wrapper.find("[data-testid='email-confirmation-banner']").attributes("role")).toBe("alert");
  });
});
