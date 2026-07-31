import { computed, ref, type ComputedRef, type Ref } from "vue";

import type {
  ImportCompletions,
  ImportMissingField,
  ImportTransactionDraft,
} from "~/features/import/model/import";

/** Uma transação incompleta e o que o usuário já respondeu sobre ela. */
export interface ImportReviewCard {
  readonly draft: ImportTransactionDraft;
  readonly answers: Readonly<Partial<Record<ImportMissingField, string>>>;
  readonly isResolved: boolean;
}

export interface UseImportReviewReturn {
  readonly cards: ComputedRef<readonly ImportReviewCard[]>;
  readonly totalCount: ComputedRef<number>;
  readonly resolvedCount: ComputedRef<number>;
  readonly pendingCount: ComputedRef<number>;
  readonly isComplete: ComputedRef<boolean>;
  readonly completions: ComputedRef<ImportCompletions>;
  readonly answer: (
    draftId: string,
    field: ImportMissingField,
    value: string,
  ) => void;
  readonly reset: () => void;
}

type AnswerMap = Record<string, Partial<Record<ImportMissingField, string>>>;

/**
 * Campo só conta como respondido com conteúdo de verdade: string vazia viraria
 * 422 no backend, que valida com as mesmas regras do v1.
 *
 * @param value Valor digitado.
 * @returns True quando há conteúdo utilizável.
 */
const isAnswered = (value: string | undefined): boolean =>
  typeof value === "string" && value.trim().length > 0;

/**
 * Estado da conferência de linhas incompletas (#1299): cards, contadores e o
 * payload de `completions` que o confirm espera.
 *
 * @param drafts Transações selecionadas que voltaram com `missing_fields`.
 * @returns Estado reativo e handlers da conferência.
 */
export function useImportReview(
  drafts: Ref<readonly ImportTransactionDraft[]>,
): UseImportReviewReturn {
  const answersByDraft = ref<AnswerMap>({});

  const cards = computed((): readonly ImportReviewCard[] =>
    drafts.value.map((draft) => {
      const answers = answersByDraft.value[draft.id] ?? {};
      return {
        draft,
        answers,
        isResolved: draft.missingFields.every((field) => isAnswered(answers[field])),
      };
    }),
  );

  const resolvedCount = computed(
    (): number => cards.value.filter((card) => card.isResolved).length,
  );

  const completions = computed((): ImportCompletions => {
    const payload: AnswerMap = {};

    for (const card of cards.value) {
      const answered = card.draft.missingFields.filter((field) =>
        isAnswered(card.answers[field]),
      );

      if (answered.length === 0) {
        continue;
      }

      payload[card.draft.id] = Object.fromEntries(
        answered.map((field) => [field, (card.answers[field] ?? "").trim()]),
      );
    }

    return payload;
  });

  /**
   * Registra a resposta do usuário para um campo faltante.
   *
   * @param draftId Id do draft respondido.
   * @param field Campo preenchido.
   * @param value Valor digitado.
   */
  const answer = (
    draftId: string,
    field: ImportMissingField,
    value: string,
  ): void => {
    answersByDraft.value = {
      ...answersByDraft.value,
      [draftId]: { ...answersByDraft.value[draftId], [field]: value },
    };
  };

  /** Limpa todas as respostas. */
  const reset = (): void => {
    answersByDraft.value = {};
  };

  return {
    cards,
    totalCount: computed((): number => cards.value.length),
    resolvedCount,
    pendingCount: computed((): number => cards.value.length - resolvedCount.value),
    isComplete: computed(
      (): boolean =>
        cards.value.length > 0 && resolvedCount.value === cards.value.length,
    ),
    completions,
    answer,
    reset,
  };
}
