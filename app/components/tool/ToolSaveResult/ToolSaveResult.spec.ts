import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { ref } from "vue";

import ToolSaveResult from "./ToolSaveResult.vue";
import { useSessionStore } from "~/stores/session";

const mockMutateAsync = vi.fn();
const mockIsPending = ref(false);

vi.mock("~/features/receivables/queries/use-create-receivable-mutation", () => ({
  useCreateReceivableMutation: (): unknown => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsPending,
  }),
}));

vi.mock("~/features/goals/queries/use-create-goal-mutation", () => ({
  useCreateGoalMutation: (): unknown => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsPending,
  }),
}));

vi.mock("~/features/transactions/queries/use-create-transaction-mutation", () => ({
  useCreateTransactionMutation: (): unknown => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsPending,
  }),
}));

vi.mock("~/core/observability", () => ({
  captureException: vi.fn(),
}));

/**
 * Builds a wrapper for ToolSaveResult with the given props.
 * @param props Component props override.
 * @returns Vue Test Utils wrapper.
 */
/**
 * Mounts ToolSaveResult with lightweight stubs that render slot content.
 * @param props Component props override.
 * @returns Vue Test Utils wrapper.
 */
function mountComponent(props: Record<string, unknown> = {}): ReturnType<typeof mount> {
  return mount(ToolSaveResult, {
    props: {
      intent: "receivable",
      label: "13º Salário",
      amount: 500000,
      ...props,
    },
    global: {
      stubs: {
        NButton: { template: "<button @click=\"$emit('click')\"><slot /><slot name=\"icon\" /></button>" },
        NIcon: { template: "<span><slot /></span>" },
        NAlert: { template: "<div class=\"n-alert\"><slot /></div>" },
        Check: { template: "<i />" },
        Save: { template: "<i />" },
        AlertCircle: { template: "<i />" },
      },
    },
  });
}

describe("ToolSaveResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockReset();
    mockIsPending.value = false;
    setActivePinia(createPinia());
  });

  it("does not render when intent is none", () => {
    const session = useSessionStore();
    session.$patch({ accessToken: "t" });
    const wrapper = mountComponent({ intent: "none" });
    expect(wrapper.find(".tool-save-result").exists()).toBe(false);
  });

  it("does not render when user is not authenticated", () => {
    const wrapper = mountComponent({ intent: "receivable" });
    expect(wrapper.find(".tool-save-result").exists()).toBe(false);
  });

  it("renders container when authenticated with valid intent", () => {
    const session = useSessionStore();
    session.$patch({ accessToken: "t" });
    const wrapper = mountComponent({ intent: "receivable" });
    expect(wrapper.find(".tool-save-result").exists()).toBe(true);
    expect(wrapper.html()).toContain("Salvar como receita");
  });

  it("shows correct label for goal intent", () => {
    const session = useSessionStore();
    session.$patch({ accessToken: "t" });
    const wrapper = mountComponent({ intent: "goal" });
    expect(wrapper.html()).toContain("Salvar como meta");
  });

  it("shows correct label for expense intent", () => {
    const session = useSessionStore();
    session.$patch({ accessToken: "t" });
    const wrapper = mountComponent({ intent: "expense" });
    expect(wrapper.html()).toContain("Salvar como despesa");
  });

  it("calls mutateAsync on click", async () => {
    const session = useSessionStore();
    session.$patch({ accessToken: "t" });
    mockMutateAsync.mockResolvedValue({});
    const wrapper = mountComponent({ intent: "receivable" });
    await wrapper.find("button").trigger("click");
    await flushPromises();
    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
  });

  it("shows error alert on mutation failure", async () => {
    const session = useSessionStore();
    session.$patch({ accessToken: "t" });
    mockMutateAsync.mockRejectedValue(new Error("fail"));
    const wrapper = mountComponent({ intent: "goal" });
    await wrapper.find("button").trigger("click");
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".n-alert").exists()).toBe(true);
    expect(wrapper.text()).toContain("Erro ao salvar");
  });
});
