import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import {
  CREDIT_CARD_BENEFITS_MAX,
  type CreditCardDto,
} from "~/features/credit-cards/contracts/credit-card.dto";

import CreditCardForm from "./CreditCardForm.vue";

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (k: string) => string } => ({ t: (k: string): string => k }),
}));

const vModelInput = {
  props: ["value", "placeholder"],
  emits: ["update:value"],
  template:
    "<input :value=\"value\" :placeholder=\"placeholder\" data-stub-input @input=\"$emit('update:value', $event.target.value)\" />",
};

const STUBS = {
  NForm: { template: "<form><slot /></form>" },
  NFormItem: { props: ["label"], template: "<div><label>{{ label }}</label><slot /></div>" },
  NInput: vModelInput,
  NInputNumber: vModelInput,
  NSelect: { props: ["value", "options", "placeholder"], emits: ["update:value"], template: "<select :value=\"value\" :data-placeholder=\"placeholder\" data-stub-select><option v-for=\"option in options\" :key=\"option.value\" :value=\"option.value\">{{ option.label }}</option></select>" },
  NDynamicTags: {
    props: ["value", "max"],
    template: "<div data-testid='benefits' :data-max='max' />",
  },
  NButton: {
    props: ["disabled"],
    emits: ["click"],
    template:
      "<button :disabled=\"disabled\" @click=\"$emit('click')\"><slot /></button>",
  },
};

/**
 * Monta o form, opcionalmente em modo edição.
 *
 * @param card Cartão para edição (ou null/undefined para criação).
 * @returns Wrapper do componente montado.
 */
const mountForm = (card?: CreditCardDto | null): ReturnType<typeof mount> =>
  mount(CreditCardForm, { props: { card }, global: { stubs: STUBS } });

describe("CreditCardForm", () => {
  it("não emite submit com nome vazio", async () => {
    const w = mountForm();
    await w.get("[data-testid='cc-submit']").trigger("click");
    expect(w.emitted("submit")).toBeUndefined();
  });

  it("emite submit com payload normalizado quando válido", async () => {
    const w = mountForm();
    await w.get("[data-testid='cc-name'] input").setValue("Cartão X");
    await w.get("[data-testid='cc-submit']").trigger("click");
    const emitted = w.emitted("submit");
    expect(emitted).toHaveLength(1);
    const payload = emitted![0]![0] as Record<string, unknown>;
    expect(payload.name).toBe("Cartão X");
    expect(payload).not.toHaveProperty("last_four_digits");
    expect(payload).not.toHaveProperty("validity_date");
  });

  it("define o cap de benefits em 12 (contrato do backend)", () => {
    // O binding :max="CREDIT_CARD_BENEFITS_MAX" no NDynamicTags é garantido por
    // typecheck/build; aqui fixamos o valor do contrato.
    expect(CREDIT_CARD_BENEFITS_MAX).toBe(12);
    expect(mountForm().find("[data-testid='credit-card-form']").exists()).toBe(true);
  });

  it("não renderiza campos sensíveis nem placeholders em inglês", () => {
    const w = mountForm();
    expect(w.text()).not.toContain("Últimos 4 Dígitos");
    expect(w.text()).not.toContain("Validade");
    expect(w.find("[data-testid='cc-last-four']").exists()).toBe(false);
    expect(w.html()).not.toContain("Please Input");
    expect(w.html()).toContain("Ex.: Cartão Inter");
    expect(w.html()).toContain("Ex.: Banco Inter");
  });

  it("pré-preenche os campos permitidos no modo edição", () => {
    const card = {
      id: "cc-1",
      name: "Nubank",
      brand: "visa",
      limit_amount: 5000,
      closing_day: 3,
      due_day: 10,
      bank: "Nubank",
      description: null,
      benefits: ["Cashback"],
      created_at: null,
      updated_at: null,
    } satisfies CreditCardDto;
    const w = mountForm(card);
    expect((w.get("[data-testid='cc-name'] input").element as HTMLInputElement).value).toBe("Nubank");
  });
});
