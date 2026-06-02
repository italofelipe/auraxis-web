import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import type { InstallmentPreview } from "~/features/transactions/utils/preview-installments";

import PreviewInstallments from "./PreviewInstallments.vue";

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (k: string, p?: Record<string, unknown>) => string } => ({
    t: (k: string, p?: Record<string, unknown>): string =>
      p ? `${p.count}x de ${p.value} a partir de ${p.first} até ${p.last}` : k,
  }),
}));

const PREVIEW: InstallmentPreview = {
  perInstallment: "R$ 100,00",
  firstDate: "17/05/2026",
  lastDate: "17/04/2027",
  totalCount: 12,
};

describe("PreviewInstallments", () => {
  it("renderiza o texto do parcelamento quando há preview", () => {
    const w = mount(PreviewInstallments, { props: { preview: PREVIEW } });
    expect(w.get("[data-testid='installment-preview']").text()).toBe(
      "12x de R$ 100,00 a partir de 17/05/2026 até 17/04/2027",
    );
  });

  it("não renderiza nada quando preview é null", () => {
    const w = mount(PreviewInstallments, { props: { preview: null } });
    expect(w.find("[data-testid='installment-preview']").exists()).toBe(false);
  });
});
