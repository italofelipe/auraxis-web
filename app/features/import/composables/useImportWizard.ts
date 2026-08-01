import { computed, ref, type ComputedRef, type Ref } from "vue";

import {
  useConfirmImportMutation,
  useDetectImportMutation,
  usePreviewImportMutation,
} from "~/features/import/queries/use-import-mutations";
import {
  useImportReview,
  type UseImportReviewReturn,
} from "~/features/import/composables/useImportReview";
import {
  IMPORT_CONFIDENCE_THRESHOLD,
  IMPORT_MAPPING_FIELDS,
  type ImportColumnMapping,
  type ImportCompletions,
  type ImportConfirmResult,
  type ImportDetectResult,
  type ImportMappingFieldKey,
  type ImportPreview,
  type ImportRejectedRow,
  type ImportTransactionDraft,
} from "~/features/import/model/import";

/** Passos do wizard. `review` só aparece quando há linha incompleta. */
export type ImportWizardStep = "select" | "mapping" | "preview" | "review" | "success";

/** Um campo do mapeamento que o wizard precisa perguntar ao usuário. */
export interface ImportMappingFieldViewModel {
  readonly key: ImportMappingFieldKey;
  readonly value: string;
  readonly confidence: number;
  readonly sampleValues: readonly string[];
}

interface ImportWizardState {
  readonly step: Ref<ImportWizardStep>;
  readonly file: Ref<File | null>;
  readonly detectResult: Ref<ImportDetectResult | null>;
  readonly mapping: Ref<ImportColumnMapping>;
  readonly preview: Ref<ImportPreview | null>;
  readonly result: Ref<ImportConfirmResult | null>;
  readonly error: Ref<unknown>;
  readonly selectedIds: Ref<ReadonlySet<string>>;
  readonly isFinishLaterOpen: Ref<boolean>;
}

interface ImportWizardActions {
  readonly selectFile: (file: File) => Promise<void>;
  readonly setMappingField: (field: ImportMappingFieldKey, value: string) => void;
  readonly confirmMapping: () => Promise<void>;
  readonly cancelMapping: () => void;
  readonly toggleTransaction: (draftId: string) => void;
  readonly confirmImport: () => Promise<void>;
  readonly submitReview: () => Promise<void>;
  readonly confirmWithPlaceholders: () => Promise<void>;
  readonly cancelReview: () => void;
  readonly openFinishLater: () => void;
  readonly dismissFinishLater: () => void;
  readonly dismissError: () => void;
  readonly reset: () => void;
}

export interface UseImportWizardReturn extends ImportWizardState, ImportWizardActions {
  readonly isBusy: ComputedRef<boolean>;
  readonly isUpsell: ComputedRef<boolean>;
  readonly isPreviewExpired: ComputedRef<boolean>;
  readonly mappingFields: ComputedRef<readonly ImportMappingFieldViewModel[]>;
  readonly rejectedRows: ComputedRef<readonly ImportRejectedRow[]>;
  readonly selectedCount: ComputedRef<number>;
  readonly totalCount: ComputedRef<number>;
  readonly duplicateCount: ComputedRef<number>;
  readonly review: UseImportReviewReturn;
}

/**
 * Mapeamento vazio usado no estado inicial e no reset.
 *
 * @returns Mapeamento com todas as colunas em branco.
 */
const emptyMapping = (): ImportColumnMapping => ({
  dateColumn: "",
  descriptionColumn: "",
  amountColumn: "",
  typeColumn: "",
  sheetName: null,
});

/**
 * Cria o estado reativo do wizard.
 *
 * @returns Refs do wizard, ainda sem comportamento.
 */
const createState = (): ImportWizardState => ({
  step: ref<ImportWizardStep>("select"),
  file: ref<File | null>(null),
  detectResult: ref<ImportDetectResult | null>(null),
  mapping: ref<ImportColumnMapping>(emptyMapping()),
  preview: ref<ImportPreview | null>(null),
  result: ref<ImportConfirmResult | null>(null),
  error: ref<unknown>(null),
  selectedIds: ref<ReadonlySet<string>>(new Set()),
  isFinishLaterOpen: ref<boolean>(false),
});

/**
 * Extrai o status HTTP de um erro sem recorrer a `any`.
 *
 * @param error Erro capturado.
 * @returns Status HTTP quando disponível.
 */
const statusOf = (error: unknown): number | null => {
  if (error === null || typeof error !== "object") {
    return null;
  }

  if ("status" in error && typeof (error as { status?: unknown }).status === "number") {
    return (error as { status: number }).status;
  }

  const response = (error as { response?: { status?: unknown } }).response;

  return response && typeof response.status === "number" ? response.status : null;
};

/**
 * Um campo entra na etapa de mapeamento quando a detecção não foi confiante ou
 * quando nenhuma coluna foi sugerida.
 *
 * @param detectResult Resultado da detecção.
 * @param mapping Mapeamento atual.
 * @param field Campo avaliado.
 * @returns True quando é preciso perguntar ao usuário.
 */
const needsMapping = (
  detectResult: ImportDetectResult,
  mapping: ImportColumnMapping,
  field: ImportMappingFieldKey,
): boolean =>
  detectResult.confidence[field] < IMPORT_CONFIDENCE_THRESHOLD ||
  mapping[field].trim().length === 0;

/**
 * Amostras da coluna escolhida, para o usuário conferir o que está mapeando.
 *
 * @param detectResult Resultado da detecção.
 * @param columnName Coluna selecionada.
 * @returns Até três valores de amostra não vazios.
 */
const samplesFor = (
  detectResult: ImportDetectResult,
  columnName: string,
): readonly string[] => {
  const index = detectResult.headers.indexOf(columnName);

  if (index < 0) {
    return [];
  }

  return detectResult.sampleRows
    .map((row) => String(row[index] ?? ""))
    .filter((value) => value.trim().length > 0)
    .slice(0, 3);
};

/**
 * Campos do mapeamento que ainda precisam de resposta do usuário.
 *
 * @param state Estado do wizard.
 * @returns View models dos campos pendentes.
 */
const buildMappingFields = (
  state: ImportWizardState,
): readonly ImportMappingFieldViewModel[] => {
  const detected = state.detectResult.value;

  if (!detected) {
    return [];
  }

  return IMPORT_MAPPING_FIELDS.filter((field) =>
    needsMapping(detected, state.mapping.value, field),
  ).map((field) => ({
    key: field,
    value: state.mapping.value[field],
    confidence: detected.confidence[field],
    sampleValues: samplesFor(detected, state.mapping.value[field]),
  }));
};

interface WizardContext {
  readonly state: ImportWizardState;
  readonly review: UseImportReviewReturn;
  readonly incompleteDrafts: ComputedRef<readonly ImportTransactionDraft[]>;
  readonly mutations: {
    readonly detect: ReturnType<typeof useDetectImportMutation>;
    readonly preview: ReturnType<typeof usePreviewImportMutation>;
    readonly confirm: ReturnType<typeof useConfirmImportMutation>;
  };
}

/**
 * Constrói as ações do wizard sobre um contexto já montado.
 *
 * @param context Estado, conferência e mutations do wizard.
 * @returns Ações expostas à página.
 */
// eslint-disable-next-line max-lines-per-function
const createActions = (context: WizardContext): ImportWizardActions => {
  const { state, review, incompleteDrafts, mutations } = context;

  /**
   * Gera o preview e seleciona por padrão tudo que não é duplicata.
   *
   * @param file Arquivo já escolhido.
   * @param mapping Mapeamento a aplicar.
   */
  const generatePreview = async (
    file: File,
    mapping: ImportColumnMapping,
  ): Promise<void> => {
    state.error.value = null;

    try {
      const nextPreview = await mutations.preview.mutateAsync({ file, mapping });
      state.preview.value = nextPreview;
      state.selectedIds.value = new Set(
        nextPreview.transactions
          .filter((draft) => !draft.isDuplicate)
          .map((draft) => draft.id),
      );
      review.reset();
      state.step.value = "preview";
    } catch (caught) {
      state.error.value = caught;
    }
  };

  /**
   * Envia o confirm com as opções da conferência.
   *
   * @param options Respostas da conferência e/ou aceite dos placeholders.
   * @param options.completions Respostas por linha, quando houver.
   * @param options.useGenericPlaceholders Aceite do "terminar depois".
   */
  const submitConfirm = async (options: {
    completions?: ImportCompletions;
    useGenericPlaceholders?: boolean;
  }): Promise<void> => {
    const current = state.preview.value;

    if (!current) {
      return;
    }

    state.error.value = null;
    const excludeIds = current.transactions
      .filter((draft) => !state.selectedIds.value.has(draft.id))
      .map((draft) => draft.id);

    try {
      state.result.value = await mutations.confirm.mutateAsync({
        previewToken: current.previewToken,
        excludeIds,
        completions: options.completions,
        useGenericPlaceholders: options.useGenericPlaceholders,
      });
      state.isFinishLaterOpen.value = false;
      state.step.value = "success";
    } catch (caught) {
      state.error.value = caught;
    }
  };

  return {
    selectFile: async (file: File): Promise<void> => {
      state.error.value = null;
      state.file.value = file;

      try {
        const detected = await mutations.detect.mutateAsync(file);
        state.detectResult.value = detected;
        state.mapping.value = detected.suggestedMapping;

        const pending = IMPORT_MAPPING_FIELDS.filter((field) =>
          needsMapping(detected, detected.suggestedMapping, field),
        );

        if (pending.length > 0) {
          state.step.value = "mapping";
          return;
        }

        await generatePreview(file, detected.suggestedMapping);
      } catch (caught) {
        state.error.value = caught;
      }
    },
    setMappingField: (field: ImportMappingFieldKey, value: string): void => {
      state.mapping.value = { ...state.mapping.value, [field]: value };
    },
    confirmMapping: async (): Promise<void> => {
      if (state.file.value) {
        await generatePreview(state.file.value, state.mapping.value);
      }
    },
    cancelMapping: (): void => {
      state.step.value = "select";
    },
    toggleTransaction: (draftId: string): void => {
      const next = new Set(state.selectedIds.value);

      if (next.has(draftId)) {
        next.delete(draftId);
      } else {
        next.add(draftId);
      }

      state.selectedIds.value = next;
    },
    confirmImport: async (): Promise<void> => {
      if (!state.preview.value) {
        return;
      }

      // Nada entra pela metade sem o usuário saber: havendo linha incompleta
      // selecionada, a conferência vem antes do confirm (#1299).
      if (incompleteDrafts.value.length > 0) {
        state.error.value = null;
        state.step.value = "review";
        return;
      }

      await submitConfirm({});
    },
    submitReview: async (): Promise<void> => {
      if (review.isComplete.value) {
        await submitConfirm({ completions: review.completions.value });
      }
    },
    confirmWithPlaceholders: async (): Promise<void> => {
      // O que já foi respondido continua valendo; o placeholder cobre o resto.
      await submitConfirm({
        completions: review.completions.value,
        useGenericPlaceholders: true,
      });
    },
    cancelReview: (): void => {
      state.isFinishLaterOpen.value = false;
      state.step.value = "preview";
    },
    openFinishLater: (): void => {
      state.isFinishLaterOpen.value = true;
    },
    dismissFinishLater: (): void => {
      state.isFinishLaterOpen.value = false;
    },
    dismissError: (): void => {
      state.error.value = null;
    },
    reset: (): void => {
      state.step.value = "select";
      state.file.value = null;
      state.detectResult.value = null;
      state.mapping.value = emptyMapping();
      state.preview.value = null;
      state.result.value = null;
      state.error.value = null;
      state.selectedIds.value = new Set();
      state.isFinishLaterOpen.value = false;
      review.reset();
      mutations.detect.reset();
      mutations.preview.reset();
      mutations.confirm.reset();
    },
  };
};

/**
 * Máquina do wizard de import: select → mapping → preview → review → success.
 *
 * A etapa de mapeamento só aparece para os campos que a detecção não resolveu,
 * e a de conferência só quando o preview traz linha incompleta selecionada.
 *
 * @returns Estado reativo e ações do wizard.
 */
export function useImportWizard(): UseImportWizardReturn {
  const state = createState();
  const mutations = {
    detect: useDetectImportMutation(),
    preview: usePreviewImportMutation(),
    confirm: useConfirmImportMutation(),
  };

  // Só o que o usuário mantém selecionado precisa de conferência: desmarcar a
  // linha já é uma resposta válida para "não quero essa transação".
  const incompleteDrafts = computed((): readonly ImportTransactionDraft[] =>
    (state.preview.value?.transactions ?? []).filter(
      (draft) =>
        state.selectedIds.value.has(draft.id) && draft.missingFields.length > 0,
    ),
  );
  const review = useImportReview(incompleteDrafts);
  const actions = createActions({ state, review, incompleteDrafts, mutations });

  return {
    ...state,
    ...actions,
    isBusy: computed(
      (): boolean =>
        mutations.detect.isPending.value ||
        mutations.preview.isPending.value ||
        mutations.confirm.isPending.value,
    ),
    isUpsell: computed((): boolean => statusOf(state.error.value) === 429),
    isPreviewExpired: computed((): boolean => statusOf(state.error.value) === 422),
    mappingFields: computed(
      (): readonly ImportMappingFieldViewModel[] => buildMappingFields(state),
    ),
    rejectedRows: computed(
      (): readonly ImportRejectedRow[] => state.preview.value?.rejectedRows ?? [],
    ),
    selectedCount: computed((): number => state.selectedIds.value.size),
    totalCount: computed((): number => state.preview.value?.transactions.length ?? 0),
    duplicateCount: computed((): number => state.preview.value?.duplicatesCount ?? 0),
    review,
  };
}
