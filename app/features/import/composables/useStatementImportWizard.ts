/**
 * Wizard do import de extrato em PDF.
 *
 * Façade fina, como manda a estrutura de feature: regra de domínio (o que cada
 * filtro significa, qual ação uma linha recebe por padrão) vive no model, e o
 * que toca API e cache vive nas queries. Aqui fica só o estado da tela.
 */

import { computed, ref, type ComputedRef, type Ref } from "vue";

import {
  STATEMENT_ACCEPTED_EXTENSIONS,
  STATEMENT_MAX_FILE_BYTES,
  effectiveAction,
  matchesStatementFilter,
  type StatementConfirmResult,
  type StatementDecision,
  type StatementDecisionAction,
  type StatementEntry,
  type StatementFilter,
  type StatementPreview,
} from "~/features/import/model/statement-import";
import {
  useStatementConfirmMutation,
  useStatementUploadMutation,
} from "~/features/import/queries/use-statement-import-mutations";

/** Passos do wizard. */
export type StatementWizardStep = "account" | "select" | "review" | "success";

/** Erros que a tela sabe distinguir e explicar. */
export type StatementWizardError =
  | "none"
  | "no-account"
  | "file-too-large"
  | "wrong-format"
  | "scanned"
  | "corrupt"
  | "unknown-bank"
  | "expired"
  | "conflicts"
  | "generic";

/** O que o composable expõe para a página. */
export interface StatementImportWizard {
  readonly step: Ref<StatementWizardStep>;
  readonly accountId: Ref<string | null>;
  readonly file: Ref<File | null>;
  readonly preview: Ref<StatementPreview | null>;
  readonly result: Ref<StatementConfirmResult | null>;
  readonly error: Ref<StatementWizardError>;
  readonly errorDetail: Ref<string>;
  readonly filter: Ref<StatementFilter>;
  readonly decisions: Ref<ReadonlyMap<number, StatementDecision>>;
  readonly visibleEntries: ComputedRef<readonly StatementEntry[]>;
  readonly selectedCount: ComputedRef<number>;
  readonly linkedCount: ComputedRef<number>;
  readonly ignoredCount: ComputedRef<number>;
  readonly unresolvedConflicts: ComputedRef<readonly StatementEntry[]>;
  readonly canConfirm: ComputedRef<boolean>;
  readonly isBusy: ComputedRef<boolean>;
  readonly chooseAccount: (id: string) => void;
  readonly selectFile: (file: File) => Promise<void>;
  readonly decide: (decision: StatementDecision) => void;
  readonly clearDecision: (lineIndex: number) => void;
  readonly actionFor: (entry: StatementEntry) => StatementDecisionAction | null;
  readonly confirm: () => Promise<void>;
  readonly reset: () => void;
  readonly dismissError: () => void;
}

/**
 * Lê o status HTTP de um erro, tolerando as duas formas que o projeto produz.
 *
 * @param error Erro capturado.
 * @returns O status, ou null.
 */
const statusOf = (error: unknown): number | null => {
  if (typeof error !== "object" || error === null) {
    return null;
  }
  const candidate = error as { status?: number; response?: { status?: number } };
  return candidate.status ?? candidate.response?.status ?? null;
};

/**
 * Lê o código estável que o backend mandou.
 *
 * Classificar por código e não pela frase: a prosa é traduzível e reescrevível,
 * e uma tela que decide o que mostrar procurando "escaneada" dentro de uma
 * mensagem quebra na primeira revisão de texto.
 *
 * @param error Erro capturado.
 * @returns O código, ou string vazia.
 */
const codeOf = (error: unknown): string => {
  if (typeof error !== "object" || error === null) {
    return "";
  }
  const candidate = error as {
    code?: string;
    response?: { data?: { error?: string | { code?: string } } };
  };
  const fromResponse = candidate.response?.data?.error;
  if (typeof fromResponse === "string") {
    return fromResponse;
  }
  return fromResponse?.code ?? candidate.code ?? "";
};

/**
 * Lê a mensagem que o backend mandou, que é sempre mais específica do que
 * qualquer texto genérico que a tela poderia inventar.
 *
 * @param error Erro capturado.
 * @returns A mensagem, ou string vazia.
 */
const detailOf = (error: unknown): string => {
  if (typeof error !== "object" || error === null) {
    return "";
  }
  const candidate = error as {
    response?: { data?: { detail?: string; message?: string } };
    message?: string;
  };
  return (
    candidate.response?.data?.message ??
    candidate.response?.data?.detail ??
    candidate.message ??
    ""
  );
};

/** Código do backend → erro que a tela sabe explicar. */
const ERROR_BY_CODE: Record<string, StatementWizardError> = {
  STATEMENT_TOO_LARGE: "file-too-large",
  STATEMENT_NOT_PDF: "wrong-format",
  STATEMENT_EMPTY: "corrupt",
  STATEMENT_BAD_ACCOUNT: "no-account",
  STATEMENT_PDF_ENCRYPTED: "corrupt",
  STATEMENT_PDF_SCANNED: "scanned",
  STATEMENT_PDF_UNREADABLE: "corrupt",
  STATEMENT_UNKNOWN_LAYOUT: "unknown-bank",
  STATEMENT_PREVIEW_EXPIRED: "expired",
};

/**
 * Classifica a falha do upload no vocabulário da tela.
 *
 * Cada caso ganha uma mensagem própria porque cada um tem uma saída diferente:
 * exportar sem senha, baixar em outro formato, usar o endpoint de OFX. "Algo
 * deu errado" não diz ao usuário o que fazer a seguir.
 *
 * @param error Erro capturado.
 * @returns O erro de tela correspondente.
 */
const classifyUploadError = (error: unknown): StatementWizardError => {
  const byCode = ERROR_BY_CODE[codeOf(error)];
  if (byCode) {
    return byCode;
  }
  // Sem código, resta o status. Menos preciso — os três motivos de 422 viram
  // um só — mas ainda melhor que "algo deu errado".
  const status = statusOf(error);
  if (status === 413) {
    return "file-too-large";
  }
  if (status === 415) {
    return "wrong-format";
  }
  if (status === 422 || status === 400) {
    return "corrupt";
  }
  return "generic";
};

/**
 * Recusa localmente o que já dá para saber daqui.
 *
 * O backend revalida tudo de qualquer forma; isto só evita gastar uma ida ao
 * servidor com um arquivo que nunca teve chance.
 *
 * @param chosen Arquivo escolhido.
 * @param accountId Conta de destino já escolhida, se houver.
 * @returns O motivo da recusa, ou null quando o arquivo pode subir.
 */
const validateChosenFile = (
  chosen: File,
  accountId: string | null,
): StatementWizardError | null => {
  if (accountId === null) {
    return "no-account";
  }
  const isPdf = STATEMENT_ACCEPTED_EXTENSIONS.some((extension) =>
    chosen.name.toLowerCase().endsWith(extension),
  );
  if (!isPdf) {
    return "wrong-format";
  }
  if (chosen.size > STATEMENT_MAX_FILE_BYTES) {
    return "file-too-large";
  }
  return null;
};

/**
 * Monta o corpo da confirmação a partir do que está na tela.
 *
 * Linhas sem ação efetiva ficam de fora — silêncio não é consentimento, e uma
 * linha que o usuário não marcou não deve virar transação.
 *
 * @param entries Todas as linhas da prévia.
 * @param decisions Decisões explícitas do usuário.
 * @param actionFor Resolve a ação efetiva de uma linha.
 * @returns As decisões a enviar.
 */
const buildDecisionPayload = (
  entries: readonly StatementEntry[],
  decisions: ReadonlyMap<number, StatementDecision>,
  actionFor: (entry: StatementEntry) => StatementDecisionAction | null,
): StatementDecision[] =>
  entries
    .map((entry): StatementDecision | null => {
      const action = actionFor(entry);
      if (action === null) {
        return null;
      }
      const explicit = decisions.get(entry.lineIndex);
      if (explicit) {
        return explicit;
      }
      const shouldLink = Boolean(entry.matchedTransactionId) && action === "link_existing";
      return {
        lineIndex: entry.lineIndex,
        action,
        ...(shouldLink ? { matchedTransactionId: entry.matchedTransactionId! } : {}),
      };
    })
    .filter((decision): decision is StatementDecision => decision !== null);

/**
 * Classifica a falha da confirmação.
 *
 * @param error Erro capturado.
 * @returns O erro de tela correspondente.
 */
const classifyConfirmError = (error: unknown): StatementWizardError => {
  const byCode = ERROR_BY_CODE[codeOf(error)];
  if (byCode) {
    return byCode;
  }
  const status = statusOf(error);
  if (status === 404) {
    return "expired";
  }
  if (status === 409) {
    return "conflicts";
  }
  return "generic";
};

/**
 * Monta o estado do wizard.
 *
 * @param uploadMutation Mutation de upload injetada em teste.
 * @param confirmMutation Mutation de confirmação injetada em teste.
 * @returns O wizard.
 */
/** O estado bruto do wizard, antes de qualquer derivação. */
interface StatementWizardState {
  readonly step: Ref<StatementWizardStep>;
  readonly accountId: Ref<string | null>;
  readonly file: Ref<File | null>;
  readonly preview: Ref<StatementPreview | null>;
  readonly result: Ref<StatementConfirmResult | null>;
  readonly error: Ref<StatementWizardError>;
  readonly errorDetail: Ref<string>;
  readonly filter: Ref<StatementFilter>;
  readonly decisions: Ref<ReadonlyMap<number, StatementDecision>>;
}

/**
 * Cria os refs do wizard.
 *
 * Separado da montagem porque o limite de statements por função do projeto é
 * 18 e a declaração do estado sozinha já consome metade — o mesmo recorte que
 * `useImportWizard` faz.
 *
 * @returns O estado inicial.
 */
const createStatementState = (): StatementWizardState => ({
  step: ref<StatementWizardStep>("account"),
  accountId: ref<string | null>(null),
  file: ref<File | null>(null),
  preview: ref<StatementPreview | null>(null),
  result: ref<StatementConfirmResult | null>(null),
  error: ref<StatementWizardError>("none"),
  errorDetail: ref(""),
  filter: ref<StatementFilter>("all"),
  decisions: ref<ReadonlyMap<number, StatementDecision>>(new Map()),
});

/**
 * Monta o estado do wizard de import de extrato.
 *
 * @param uploadMutation Mutation de upload, injetável em teste.
 * @param confirmMutation Mutation de confirmação, injetável em teste.
 * @returns O wizard, pronto para a página consumir.
 */
// eslint-disable-next-line max-lines-per-function, max-statements
export const useStatementImportWizard = (
  uploadMutation = useStatementUploadMutation(),
  confirmMutation = useStatementConfirmMutation(),
): StatementImportWizard => {
  const {
    step,
    accountId,
    file,
    preview,
    result,
    error,
    errorDetail,
    filter,
    decisions,
  } = createStatementState();

  const entries = computed<readonly StatementEntry[]>(
    () => preview.value?.entries ?? [],
  );

  const visibleEntries = computed<readonly StatementEntry[]>(() =>
    entries.value.filter((entry) => matchesStatementFilter(entry, filter.value)),
  );

  /**
   * Ação efetiva de uma linha: a decisão do usuário, ou a proposta do sistema.
   *
   * @param entry Lançamento avaliado.
   * @returns A ação, ou null quando a linha fica de fora.
   */
  const actionFor = (entry: StatementEntry): StatementDecisionAction | null =>
    effectiveAction(entry, decisions.value.get(entry.lineIndex));

  /**
   * Conta as linhas cuja ação efetiva é a informada.
   *
   * @param action Ação procurada.
   * @returns Quantas linhas terão essa ação.
   */
  const countWith = (action: StatementDecisionAction): number =>
    entries.value.filter((entry) => actionFor(entry) === action).length;

  const selectedCount = computed(() => countWith("import"));
  const linkedCount = computed(() => countWith("link_existing"));
  const ignoredCount = computed(() => countWith("ignore"));
  const unresolvedConflicts = computed<readonly StatementEntry[]>(() =>
    entries.value.filter(
      (entry) =>
        entry.matchStatus === "conflict" && !decisions.value.has(entry.lineIndex),
    ),
  );
  const isBusy = computed(
    () => uploadMutation.isPending.value || confirmMutation.isPending.value,
  );
  // Confirmação exige que todo conflito tenha decisão: dois lançamentos que
  // podem ser o mesmo movimento, sem saber qual, ou duplicam uma transação ou
  // escondem uma — e o usuário não perceberia nenhum dos dois.
  const canConfirm = computed(
    () =>
      preview.value !== null &&
      unresolvedConflicts.value.length === 0 &&
      selectedCount.value + linkedCount.value + ignoredCount.value > 0 &&
      !isBusy.value,
  );

  /**
   * Guarda a conta de destino e avança.
   *
   * @param id Id da conta escolhida.
   */
  const chooseAccount = (id: string): void => {
    accountId.value = id;
    error.value = "none";
    step.value = "select";
  };

  /**
   * Valida o arquivo e sobe.
   *
   * A validação local existe para não gastar uma ida ao servidor com o que já
   * dá para saber daqui — o backend revalida tudo de qualquer forma.
   *
   * @param chosen Arquivo escolhido.
   */
  const selectFile = async (chosen: File): Promise<void> => {
    // Capturado antes da validação para que o narrowing sobreviva ao `await`:
    // `accountId.value` é um ref e o compilador não pode assumir que continua
    // preenchido depois de uma fronteira assíncrona.
    const destination = accountId.value;
    const rejection = validateChosenFile(chosen, destination);
    if (rejection !== null || destination === null) {
      error.value = rejection ?? "no-account";
      return;
    }

    file.value = chosen;
    error.value = "none";
    errorDetail.value = "";
    try {
      preview.value = await uploadMutation.mutateAsync({
        file: chosen,
        accountId: destination,
      });
      decisions.value = new Map();
      step.value = "review";
    } catch (caught) {
      error.value = classifyUploadError(caught);
      errorDetail.value = detailOf(caught);
    }
  };

  /**
   * Registra uma decisão sobre uma linha.
   *
   * O Map é substituído por inteiro em vez de mutado, para que o Vue veja a
   * mudança sem precisar de reatividade profunda.
   *
   * @param decision Decisão do usuário.
   */
  const decide = (decision: StatementDecision): void => {
    const next = new Map(decisions.value);
    next.set(decision.lineIndex, decision);
    decisions.value = next;
  };

  /**
   * Remove uma decisão, devolvendo a linha à proposta do sistema.
   *
   * @param lineIndex Linha afetada.
   */
  const clearDecision = (lineIndex: number): void => {
    const next = new Map(decisions.value);
    next.delete(lineIndex);
    decisions.value = next;
  };

  /**
   * Envia as decisões.
   */
  const confirm = async (): Promise<void> => {
    if (preview.value === null || accountId.value === null) {
      return;
    }
    if (unresolvedConflicts.value.length > 0) {
      error.value = "conflicts";
      return;
    }
    const payload = buildDecisionPayload(
      entries.value,
      decisions.value,
      actionFor,
    );

    try {
      result.value = await confirmMutation.mutateAsync({
        previewToken: preview.value.previewToken,
        accountId: accountId.value,
        decisions: payload,
      });
      step.value = "success";
      error.value = "none";
    } catch (caught) {
      error.value = classifyConfirmError(caught);
      errorDetail.value = detailOf(caught);
    }
  };

  /**
   * Volta o wizard ao início, preservando a conta já escolhida.
   */
  const reset = (): void => {
    file.value = null;
    preview.value = null;
    result.value = null;
    decisions.value = new Map();
    filter.value = "all";
    error.value = "none";
    errorDetail.value = "";
    step.value = accountId.value === null ? "account" : "select";
  };

  /**
   * Fecha o alerta de erro sem mexer no resto do estado.
   */
  const dismissError = (): void => {
    error.value = "none";
    errorDetail.value = "";
  };

  return {
    step,
    accountId,
    file,
    preview,
    result,
    error,
    errorDetail,
    filter,
    decisions,
    visibleEntries,
    selectedCount,
    linkedCount,
    ignoredCount,
    unresolvedConflicts,
    canConfirm,
    isBusy,
    chooseAccount,
    selectFile,
    decide,
    clearDecision,
    actionFor,
    confirm,
    reset,
    dismissError,
  };
};
