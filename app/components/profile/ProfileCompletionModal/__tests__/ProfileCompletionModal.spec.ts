import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ref } from "vue";
import ProfileCompletionModal from "../ProfileCompletionModal.vue";

// --- Hoisted stubs ---
// vi.mock factories are hoisted before module initialisation, so stubs must
// be created with vi.hoisted() to avoid temporal dead zone errors.

const { NModalStub, UiFormFieldStub } = vi.hoisted(() => ({
  NModalStub: {
    name: "NModal",
    props: { show: Boolean, maskClosable: Boolean },
    template: "<div v-if=\"show\" data-testid=\"n-modal\"><slot /></div>",
  },
  UiFormFieldStub: {
    name: "UiFormField",
    props: ["label", "fieldId", "error", "required"],
    template: "<div data-testid=\"ui-form-field\"><label>{{ label }}</label><slot /></div>",
  },
}));

const mockMutate = vi.fn();
const mockIsPending = ref(false);

vi.mock("~/features/profile/composables/use-update-profile-mutation", () => ({
  useUpdateProfileMutation: (): { mutate: typeof mockMutate; isPending: typeof mockIsPending } => ({
    mutate: mockMutate,
    isPending: mockIsPending,
  }),
}));

const mockProfile = ref<Record<string, unknown> | null>(null);
const mockIsLoaded = ref(false);

vi.mock("~/stores/user", () => ({
  useUserStore: (): { profile: Record<string, unknown> | null; isLoaded: boolean } => ({
    profile: mockProfile.value,
    isLoaded: mockIsLoaded.value,
  }),
}));

const mockMessageSuccess = vi.fn();
const mockMessageError = vi.fn();

vi.mock("naive-ui", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    NModal: NModalStub,
    useMessage: (): { success: typeof mockMessageSuccess; error: typeof mockMessageError } => ({
      success: mockMessageSuccess,
      error: mockMessageError,
    }),
  };
});

vi.mock("~/components/ui/UiFormField/UiFormField.vue", () => ({
  default: UiFormFieldStub,
}));

// --- Helpers ---

/**
 * Mounts ProfileCompletionModal with the given open state.
 *
 * @param open Whether the modal should be open.
 * @returns The mounted wrapper.
 */
const mountModal = (open = true): VueWrapper => mount(ProfileCompletionModal, {
  props: { open },
  global: {
    stubs: {
      NModal: NModalStub,
      UiFormField: UiFormFieldStub,
    },
  },
});

// --- Tests ---

describe("ProfileCompletionModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending.value = false;
    mockProfile.value = null;
    mockIsLoaded.value = false;
  });

  it("renders without crashing when open=false", () => {
    const wrapper = mountModal(false);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find("[data-testid=\"n-modal\"]").exists()).toBe(false);
  });

  it("renders modal content when open=true", () => {
    const wrapper = mountModal(true);
    expect(wrapper.find("[data-testid=\"n-modal\"]").exists()).toBe(true);
  });

  it("renders all required field labels", () => {
    const wrapper = mountModal(true);
    const labels = wrapper.findAll("[data-testid=\"ui-form-field\"] label").map((l) => l.text());
    expect(labels).toContain("Gênero");
    expect(labels).toContain("Data de nascimento");
    expect(labels).toContain("Renda mensal (R$)");
    expect(labels).toContain("Patrimônio líquido (R$)");
    expect(labels).toContain("Gastos mensais (R$)");
    expect(labels).toContain("Estado (UF)");
    expect(labels).toContain("Profissão");
    expect(labels).toContain("Perfil de investidor");
    expect(labels).toContain("Objetivos financeiros");
  });

  it("renders optional section label", () => {
    const wrapper = mountModal(true);
    expect(wrapper.html()).toContain("Informações opcionais");
  });

  it("emits close when dismiss button is clicked", async () => {
    const wrapper = mountModal(true);
    const closeBtn = wrapper.find("button[aria-label=\"Fechar modal\"]");
    expect(closeBtn.exists()).toBe(true);
    await closeBtn.trigger("click");
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("emits close when 'Preencher depois' button is clicked", async () => {
    const wrapper = mountModal(true);
    const laterBtn = wrapper.findAll("button").find((b) => b.text().includes("Preencher depois"));
    expect(laterBtn).toBeDefined();
    await laterBtn!.trigger("click");
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("shows spinner and 'Salvando...' text when isPending is true", async () => {
    mockIsPending.value = true;
    const wrapper = mountModal(true);
    expect(wrapper.find(".profile-modal__spinner").exists()).toBe(true);
    const submitBtn = wrapper.find("button[type=\"submit\"]");
    expect(submitBtn.text()).toContain("Salvando...");
  });

  it("submit button has correct label when not pending", () => {
    const wrapper = mountModal(true);
    const submitBtn = wrapper.find("button[type=\"submit\"]");
    expect(submitBtn.text()).toContain("Atualizar dados");
  });

  it("close button has correct aria-label", () => {
    const wrapper = mountModal(true);
    const closeBtn = wrapper.find("button[aria-label=\"Fechar modal\"]");
    expect(closeBtn.exists()).toBe(true);
  });

  it("submit button has aria-busy when pending", async () => {
    mockIsPending.value = true;
    const wrapper = mountModal(true);
    const submitBtn = wrapper.find("button[type=\"submit\"]");
    expect(submitBtn.attributes("aria-busy")).toBe("true");
  });
});
