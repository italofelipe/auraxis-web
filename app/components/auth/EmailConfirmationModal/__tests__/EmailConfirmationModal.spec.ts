import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EmailConfirmationModal from "../EmailConfirmationModal.vue";

const resendMutateMock = vi.hoisted(() => vi.fn());

const sessionMock = {
  isAuthenticated: true as boolean,
  userEmail: "pending@auraxis.com" as string | null,
  emailConfirmed: false as boolean | null,
  emailConfirmationDeadlineAt: "2026-06-03T10:00:00Z" as string | null,
  emailConfirmationBlocked: false,
};

vi.mock("~/stores/session", () => ({
  useSessionStore: (): typeof sessionMock => sessionMock,
}));

vi.mock("~/features/auth/queries/use-resend-confirmation-mutation", () => ({
  useResendConfirmationMutation: (): {
    mutate: typeof resendMutateMock;
    isPending: ReturnType<typeof ref<boolean>>;
    isSuccess: ReturnType<typeof ref<boolean>>;
    isError: ReturnType<typeof ref<boolean>>;
    error: ReturnType<typeof ref<Error | null>>;
  } => ({
    mutate: resendMutateMock,
    isPending: ref(false),
    isSuccess: ref(false),
    isError: ref(false),
    error: ref(null),
  }),
}));

vi.mock("naive-ui", async (importOriginal) => {
  const { NModalStub } = await import("~/test-utils/stubs");
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    NModal: NModalStub,
    NAlert: { template: "<div role=\"alert\"><slot /></div>" },
    NButton: {
      props: ["disabled", "loading", "type", "secondary"],
      emits: ["click"],
      template: "<button :disabled=\"disabled\" @click=\"$emit('click')\"><slot /></button>",
    },
  };
});

describe("EmailConfirmationModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionMock.isAuthenticated = true;
    sessionMock.userEmail = "pending@auraxis.com";
    sessionMock.emailConfirmed = false;
    sessionMock.emailConfirmationDeadlineAt = "2026-06-03T10:00:00Z";
    sessionMock.emailConfirmationBlocked = false;
  });

  it("shows a dismissible confirmation reminder for authenticated unconfirmed users", async () => {
    const wrapper = mount(EmailConfirmationModal);

    expect(wrapper.text()).toContain("Confirme seu e-mail");
    expect(wrapper.text()).toContain("pe***@auraxis.com");

    await wrapper.get("[data-testid='email-confirmation-dismiss']").trigger("click");

    expect(wrapper.find("[data-testid='n-modal']").exists()).toBe(false);
  });

  it("resends confirmation email and starts a session cooldown", async () => {
    const wrapper = mount(EmailConfirmationModal);

    await wrapper.get("[data-testid='email-confirmation-resend']").trigger("click");

    expect(resendMutateMock).toHaveBeenCalledOnce();
    expect(sessionStorage.getItem("auraxis:email-confirmation-resend:pending@auraxis.com")).not.toBeNull();
  });

  it("renders a non-dismissible modal when the backend marks confirmation as blocked", () => {
    sessionMock.emailConfirmationBlocked = true;

    const wrapper = mount(EmailConfirmationModal);

    expect(wrapper.text()).toContain("Confirme seu e-mail para continuar");
    expect(wrapper.find("[data-testid='email-confirmation-dismiss']").exists()).toBe(false);
  });

  it("does not render for confirmed users", () => {
    sessionMock.emailConfirmed = true;

    const wrapper = mount(EmailConfirmationModal);

    expect(wrapper.find("[data-testid='n-modal']").exists()).toBe(false);
  });
});
