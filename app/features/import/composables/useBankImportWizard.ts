import { computed, ref, type ComputedRef, type Ref } from "vue";

import {
  useConfirmBankStatementMutation,
  useUploadBankStatementMutation,
} from "~/features/import/queries/use-bank-import-mutations";
import {
  bankImportNeedsBankChoice,
  type BankImportBankId,
  type BankImportPreview,
} from "~/features/import/model/bank-import";
import type { ImportConfirmResult } from "~/features/import/model/import";

/**
 * Passos do wizard de extrato.
 *
 * Mais curto que o da planilha de propósito: não há `mapping` porque o formato
 * do arquivo é a assinatura, nem `review` porque o parser lê o extrato inteiro
 * ou falha — não existe linha "pela metade" para conferir.
 */
export type BankImportWizardStep = "select" | "bank" | "preview" | "success";

interface BankImportWizardState {
  readonly step: Ref<BankImportWizardStep>;
  readonly file: Ref<File | null>;
  readonly bankId: Ref<BankImportBankId | null>;
  readonly preview: Ref<BankImportPreview | null>;
  readonly result: Ref<ImportConfirmResult | null>;
  readonly error: Ref<unknown>;
  readonly selectedIds: Ref<ReadonlySet<string>>;
}

interface BankImportWizardActions {
  readonly selectFile: (file: File) => Promise<void>;
  readonly setBank: (bankId: BankImportBankId) => void;
  readonly confirmBank: () => Promise<void>;
  readonly cancelBank: () => void;
  readonly toggleTransaction: (draftId: string) => void;
  readonly confirmImport: () => Promise<void>;
  readonly dismissError: () => void;
  readonly reset: () => void;
}

export interface UseBankImportWizardReturn
  extends BankImportWizardState,
    BankImportWizardActions {
  readonly isBusy: ComputedRef<boolean>;
  readonly needsBankChoice: ComputedRef<boolean>;
  readonly canConfirmBank: ComputedRef<boolean>;
  readonly isUpsell: ComputedRef<boolean>;
  readonly isFileUnreadable: ComputedRef<boolean>;
  readonly isPreviewExpired: ComputedRef<boolean>;
  readonly isAlreadyConfirmed: ComputedRef<boolean>;
  readonly selectedCount: ComputedRef<number>;
  readonly totalCount: ComputedRef<number>;
  readonly duplicateCount: ComputedRef<number>;
}

/**
 * Cria o estado reativo do wizard de extrato.
 *
 * @returns Refs do wizard, ainda sem comportamento.
 */
const createState = (): BankImportWizardState => ({
  step: ref<BankImportWizardStep>("select"),
  file: ref<File | null>(null),
  bankId: ref<BankImportBankId | null>(null),
  preview: ref<BankImportPreview | null>(null),
  result: ref<ImportConfirmResult | null>(null),
  error: ref<unknown>(null),
  selectedIds: ref<ReadonlySet<string>>(new Set()),
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

interface BankWizardContext {
  readonly state: BankImportWizardState;
  readonly mutations: {
    readonly upload: ReturnType<typeof useUploadBankStatementMutation>;
    readonly confirm: ReturnType<typeof useConfirmBankStatementMutation>;
  };
}

/**
 * Sobe o arquivo e deixa o wizard na prévia, com tudo que não é duplicata já
 * marcado.
 *
 * @param context Estado e mutations do wizard.
 * @param file Arquivo escolhido.
 * @param bankId Banco escolhido, quando o formato exige.
 */
const upload = async (
  context: BankWizardContext,
  file: File,
  bankId: BankImportBankId | null,
): Promise<void> => {
  const { state, mutations } = context;
  state.error.value = null;

  try {
    const nextPreview = await mutations.upload.mutateAsync({ file, bankId });
    state.preview.value = nextPreview;
    state.selectedIds.value = new Set(
      nextPreview.transactions
        .filter((draft) => !draft.isDuplicate)
        .map((draft) => draft.id),
    );
    state.step.value = "preview";
  } catch (caught) {
    state.error.value = caught;
  }
};

/**
 * Confirma a prévia, excluindo o que o usuário desmarcou.
 *
 * @param context Estado e mutations do wizard.
 */
const confirmPreview = async (context: BankWizardContext): Promise<void> => {
  const { state, mutations } = context;
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
    });
    state.step.value = "success";
  } catch (caught) {
    state.error.value = caught;
  }
};

/**
 * Constrói as ações do wizard sobre um contexto já montado.
 *
 * @param context Estado e mutations do wizard.
 * @returns Ações expostas à página.
 */
const createActions = (context: BankWizardContext): BankImportWizardActions => {
  const { state, mutations } = context;

  return {
    selectFile: async (file: File): Promise<void> => {
      state.error.value = null;
      state.file.value = file;

      // Subir cego e reagir ao `requires_confirmation` queimaria duas cotas
      // freemium pelo mesmo arquivo, e acima de 0.8 de confiança o backend
      // adivinha em silêncio — palpite errado inverte a convenção de sinal.
      if (bankImportNeedsBankChoice(file)) {
        state.step.value = "bank";
        return;
      }

      state.bankId.value = null;
      await upload(context, file, null);
    },
    setBank: (bankId: BankImportBankId): void => {
      state.bankId.value = bankId;
    },
    confirmBank: async (): Promise<void> => {
      if (!state.file.value || !state.bankId.value) {
        return;
      }

      await upload(context, state.file.value, state.bankId.value);
    },
    cancelBank: (): void => {
      state.file.value = null;
      state.bankId.value = null;
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
    confirmImport: (): Promise<void> => confirmPreview(context),
    dismissError: (): void => {
      state.error.value = null;
    },
    reset: (): void => {
      state.step.value = "select";
      state.file.value = null;
      state.bankId.value = null;
      state.preview.value = null;
      state.result.value = null;
      state.error.value = null;
      state.selectedIds.value = new Set();
      mutations.upload.reset();
      mutations.confirm.reset();
    },
  };
};

/**
 * Máquina do wizard de extrato bancário: select → bank → preview → success.
 *
 * O mapeamento de erro é diferente do wizard de planilha e não pode ser
 * copiado dele: aqui **422 é arquivo corrompido** (o parser não leu), e é o
 * **404** que significa prévia expirada. Tratar 422 como "expirou" mandaria o
 * usuário reenviar um arquivo quebrado em loop.
 *
 * @returns Estado reativo e ações do wizard.
 */
export function useBankImportWizard(): UseBankImportWizardReturn {
  const state = createState();
  const mutations = {
    upload: useUploadBankStatementMutation(),
    confirm: useConfirmBankStatementMutation(),
  };
  const actions = createActions({ state, mutations });
  const status = computed((): number | null => statusOf(state.error.value));

  return {
    ...state,
    ...actions,
    isBusy: computed(
      (): boolean =>
        mutations.upload.isPending.value || mutations.confirm.isPending.value,
    ),
    needsBankChoice: computed((): boolean => state.step.value === "bank"),
    canConfirmBank: computed((): boolean => state.bankId.value !== null),
    isUpsell: computed((): boolean => status.value === 429),
    // 415 (extensão que o backend não aceita) e 422 (o parser não leu o
    // conteúdo) dizem a mesma coisa ao usuário: este arquivo não serve.
    isFileUnreadable: computed(
      (): boolean => status.value === 422 || status.value === 415,
    ),
    isPreviewExpired: computed((): boolean => status.value === 404),
    isAlreadyConfirmed: computed((): boolean => status.value === 409),
    selectedCount: computed((): number => state.selectedIds.value.size),
    totalCount: computed((): number => state.preview.value?.transactions.length ?? 0),
    duplicateCount: computed((): number => state.preview.value?.duplicatesCount ?? 0),
  };
}
