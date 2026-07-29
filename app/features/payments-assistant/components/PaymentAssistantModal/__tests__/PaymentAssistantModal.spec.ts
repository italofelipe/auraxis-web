import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref } from "vue";
import { NModal } from "naive-ui";
import PaymentAssistantModal from "../PaymentAssistantModal.vue";

const isOpen = ref(false);

vi.mock("~/composables/useToast", () => ({
  useToast: (): Record<string, unknown> => ({
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("~/features/payments-assistant/composables/use-payment-assistant", () => ({
  usePaymentAssistant: (): Record<string, unknown> => ({
    isOpen,
    isPremium: ref(true),
    current: computed(() => null),
    progress: computed(() => ({ current: 0, total: 0 })),
    isDone: computed(() => true),
    lastAction: ref(null),
    close: vi.fn(),
    maybeAutoOpen: vi.fn(),
    pay: vi.fn(),
    discard: vi.fn(),
    skipCard: vi.fn(),
    markAllPaid: vi.fn(),
    undo: vi.fn(),
  }),
}));

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string) => string; n: (value: number) => string } => ({
    t: (key: string) => key,
    n: (value: number) => String(value),
  }),
}));

describe("PaymentAssistantModal", () => {
  it("resolve os componentes do Naive em vez de emitir elementos desconhecidos", () => {
    const wrapper = mount(PaymentAssistantModal, { props: { hold: false } });

    // O componente usava NModal, NButton, NTag e NPopconfirm no template sem
    // importar nenhum deles. Sem módulo de auto-import do Naive, o Vue tratava
    // `<NModal>` como elemento customizado: sem máscara, sem card, sem rodapé —
    // e o corpo caía no fluxo normal da página.
    expect(wrapper.findComponent(NModal).exists()).toBe(true);
    expect(wrapper.html()).not.toContain("<nmodal");
  });

  it("não escreve nada na página enquanto está fechado", () => {
    isOpen.value = false;
    const wrapper = mount(PaymentAssistantModal, { props: { hold: false } });

    // Era este o sintoma relatado: "Tudo em dia ✓" aparecia no fim de todas as
    // páginas do layout autenticado, porque o corpo do modal renderizava
    // inline mesmo com o assistente fechado.
    expect(wrapper.text()).not.toContain("paymentsAssistant.emptyTitle");
    expect(wrapper.text().trim()).toBe("");
  });
});
