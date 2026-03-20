import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import SaveSimulationButton from "./SaveSimulationButton.vue";

const mockPush = vi.hoisted(() => vi.fn());
const mockMessageSuccess = vi.hoisted(() => vi.fn());
const mockMessageError = vi.hoisted(() => vi.fn());
const mockRestore = vi.hoisted(() => vi.fn());
const mockSave = vi.hoisted(() => vi.fn());
const mockMutate = vi.hoisted(() => vi.fn());

vi.mock("#app", () => ({
  useRouter: (): { push: ReturnType<typeof vi.fn> } => ({ push: mockPush }),
}));

vi.mock("naive-ui", () => ({
  NButton: {
    props: ["type", "size", "loading", "disabled"],
    template:
      "<button class='n-button' :disabled='disabled || loading' @click='$emit(\"click\")'><slot /></button>",
    emits: ["click"],
  },
  useMessage: (): { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> } => ({
    success: mockMessageSuccess,
    error: mockMessageError,
  }),
}));

const mockIsAuthenticated = ref(false);
const mockIsPending = ref(false);

vi.mock("~/stores/session", () => ({
  useSessionStore: (): {
    restore: ReturnType<typeof vi.fn>;
    isAuthenticated: boolean;
  } => ({
    restore: mockRestore,
    get isAuthenticated(): boolean {
      return mockIsAuthenticated.value;
    },
  }),
}));

vi.mock("~/stores/toolContext", () => ({
  useToolContextStore: (): { save: ReturnType<typeof vi.fn> } => ({
    save: mockSave,
  }),
}));

vi.mock("~/features/simulations/queries/use-save-simulation-mutation", () => ({
  useSaveSimulationMutation: (): {
    mutate: ReturnType<typeof vi.fn>;
    isPending: typeof mockIsPending;
  } => ({
    mutate: mockMutate,
    isPending: mockIsPending,
  }),
}));

describe("SaveSimulationButton", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockRestore.mockClear();
    mockSave.mockClear();
    mockMutate.mockClear();
    mockMessageSuccess.mockClear();
    mockMessageError.mockClear();
    mockIsAuthenticated.value = false;
    mockIsPending.value = false;
  });

  it("calls save mutation when user is authenticated", async () => {
    mockIsAuthenticated.value = true;

    const wrapper = mount(SaveSimulationButton, {
      props: {
        toolSlug: "raise-calculator",
        inputs: { current: 5000 },
        result: { recommended: 5500 },
        name: "Minha simulação",
      },
    });

    await wrapper.find(".n-button").trigger("click");

    expect(mockMutate).toHaveBeenCalledOnce();
    expect(mockMutate).toHaveBeenCalledWith(
      {
        name: "Minha simulação",
        toolSlug: "raise-calculator",
        inputs: { current: 5000 },
        result: { recommended: 5500 },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("saves context and redirects to login when user is not authenticated", async () => {
    mockIsAuthenticated.value = false;

    const wrapper = mount(SaveSimulationButton, {
      props: {
        toolSlug: "raise-calculator",
        inputs: { current: 5000 },
        result: { recommended: 5500 },
      },
    });

    await wrapper.find(".n-button").trigger("click");

    expect(mockSave).toHaveBeenCalledWith("raise-calculator", { recommended: 5500 });
    expect(mockPush).toHaveBeenCalledOnce();
    const redirectArg = mockPush.mock.calls[0]?.[0] as string;
    expect(redirectArg).toContain("/login");
    expect(redirectArg).toContain("raise-calculator");
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
