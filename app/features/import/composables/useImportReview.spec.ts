import { ref } from "vue";
import { describe, expect, it } from "vitest";

import { useImportReview } from "~/features/import/composables/useImportReview";
import type { ImportTransactionDraft } from "~/features/import/model/import";

/**
 * Monta uma linha do preview já no domínio.
 *
 * @param overrides Campos a sobrescrever.
 * @returns Draft de transação.
 */
const draft = (
  overrides: Partial<ImportTransactionDraft> = {},
): ImportTransactionDraft => ({
  id: "d1",
  date: "2026-07-01",
  description: "Mercado",
  amount: "149.90",
  type: "expense",
  category: "alimentacao",
  confidence: 0.9,
  isDuplicate: false,
  missingFields: [],
  ...overrides,
});

const noTitle = draft({ id: "d1", description: "", missingFields: ["description"] });
const noAmount = draft({ id: "d2", amount: "0", missingFields: ["amount"] });

describe("useImportReview", () => {
  it("não fica completo quando não há nada para conferir", () => {
    const review = useImportReview(ref([]));

    expect(review.totalCount.value).toBe(0);
    // Fila vazia não pode liberar um confirm que nunca teve pendência.
    expect(review.isComplete.value).toBe(false);
    expect(review.completions.value).toEqual({});
  });

  it("conta pendências e libera só quando todas forem respondidas", () => {
    const review = useImportReview(ref([noTitle, noAmount]));

    expect(review.pendingCount.value).toBe(2);

    review.answer("d1", "description", "Mercado do bairro");
    expect(review.resolvedCount.value).toBe(1);
    expect(review.isComplete.value).toBe(false);

    review.answer("d2", "amount", "149,90");
    expect(review.isComplete.value).toBe(true);
    expect(review.completions.value).toEqual({
      d1: { description: "Mercado do bairro" },
      d2: { amount: "149,90" },
    });
  });

  it("ignora resposta só com espaços", () => {
    const review = useImportReview(ref([noTitle]));

    review.answer("d1", "description", "   ");

    // String vazia viraria 422 no backend, que valida com as regras do v1.
    expect(review.isComplete.value).toBe(false);
    expect(review.completions.value).toEqual({});
  });

  it("apara espaços antes de montar o payload", () => {
    const review = useImportReview(ref([noTitle]));

    review.answer("d1", "description", "  Farmácia  ");

    expect(review.completions.value).toEqual({ d1: { description: "Farmácia" } });
  });

  it("exige as duas respostas quando a linha perdeu título e valor", () => {
    const both = draft({
      id: "d3",
      description: "",
      amount: "0",
      missingFields: ["description", "amount"],
    });
    const review = useImportReview(ref([both]));

    review.answer("d3", "description", "Conta de luz");
    expect(review.isComplete.value).toBe(false);

    review.answer("d3", "amount", "212,55");
    expect(review.isComplete.value).toBe(true);
  });

  it("reage à mudança da lista de pendências", () => {
    const drafts = ref<readonly ImportTransactionDraft[]>([noTitle, noAmount]);
    const review = useImportReview(drafts);

    expect(review.totalCount.value).toBe(2);

    drafts.value = [noTitle];

    expect(review.totalCount.value).toBe(1);
  });

  it("limpa as respostas no reset", () => {
    const review = useImportReview(ref([noTitle]));

    review.answer("d1", "description", "Mercado");
    review.reset();

    expect(review.completions.value).toEqual({});
    expect(review.resolvedCount.value).toBe(0);
  });
});
