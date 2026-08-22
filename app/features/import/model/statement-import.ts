import { CurrencyFormatter } from "~/shared/utils/formatters/CurrencyFormatter";

/**
 * Domínio do import de extrato em PDF (`/v2/bank-import/statements/*`).
 *
 * Separado de `bank-import.ts` de propósito: aquele fluxo cobre OFX, QFX,
 * CNAB e CSV, entrega uma linha com quatro campos e confirma por exclusão. Este
 * exige conta de destino, devolve natureza financeira, evidência de duplicidade
 * e uma decisão por linha. Fundir os dois produziria um tipo cujos campos são
 * opcionais conforme a extensão do arquivo, que é como um contrato deixa de
 * significar alguma coisa.
 */

/** O que um lançamento é, além do sinal do valor. Espelha o enum do backend. */
export const FINANCIAL_NATURES = [
  "income",
  "expense",
  "self_transfer",
  "transfer",
  "card_bill_payment",
  "liability_payment",
  "investment_yield",
  "refund",
  "reversal",
  "bank_fee",
  "interest",
  "tax",
  "withdrawal",
  "unclassified_in",
  "unclassified_out",
] as const;

export type FinancialNature = (typeof FINANCIAL_NATURES)[number];

/**
 * Naturezas que movem dinheiro sem ganhar nem gastar. Continuam na listagem e
 * no extrato da conta, mas ficam fora dos totais de receita e despesa — é o que
 * evita contar duas vezes a compra do cartão e o pagamento da fatura.
 */
export const NEUTRAL_NATURES: readonly FinancialNature[] = [
  "self_transfer",
  "transfer",
  "card_bill_payment",
  "liability_payment",
];

/** Quão seguros estamos de que a linha já está lançada. */
export const MATCH_STATUSES = [
  "exact",
  "likely",
  "possible",
  "conflict",
  "unique",
] as const;

export type MatchStatus = (typeof MATCH_STATUSES)[number];

/** O que o usuário decidiu fazer com a linha. */
export type StatementDecisionAction = "import" | "link_existing" | "ignore";

/** Por que a linha foi apontada como possível duplicata. */
export interface MatchEvidence {
  /** Campos que coincidem entre o lançamento e a transação existente. */
  readonly agreed: readonly string[];
  /** Campos que divergem. */
  readonly diverged: readonly string[];
  /** Diferença em dias entre as duas datas, quando há candidato. */
  readonly dayDifference: number | null;
  /** Frase que justifica a classificação. */
  readonly reason: string;
  /** Quantos candidatos igualmente compatíveis existiam. */
  readonly alternatives: number;
  /** Se a linha já foi importada antes. */
  readonly alreadyImported: boolean;
}

/** Uma linha do extrato, como a tela de revisão a vê. */
export interface StatementEntry {
  readonly lineIndex: number;
  readonly pageNumber: number;
  /** `balance_marker` nunca é importável — é o saldo corrente, não um movimento. */
  readonly kind: "transaction" | "balance_marker";
  readonly postingDate: string;
  /** Data da compra embutida na descrição, quando o banco a traz. */
  readonly transactionDate: string | null;
  /** Descrição exatamente como o banco escreveu. Nunca substituída. */
  readonly rawDescription: string;
  readonly normalizedDescription: string;
  /** Valor com sinal, como string — nunca `number`, para não perder centavos. */
  readonly amount: string;
  readonly balance: string | null;
  readonly currency: string;
  readonly direction: "credit" | "debit";
  readonly movementType: string;
  readonly counterpartyName: string | null;
  readonly financialNature: FinancialNature | null;
  readonly suggestedCategory: string | null;
  /** Confiança da classificação, como string de três casas. */
  readonly confidence: string;
  readonly rationale: string | null;
  readonly needsReview: boolean;
  readonly recurrenceHint: boolean;
  readonly isNeutralNature: boolean;
  readonly matchStatus: MatchStatus;
  readonly matchedTransactionId: string | null;
  readonly matchScore: string;
  readonly matchEvidence: MatchEvidence;
  /** Decisão tomada numa importação anterior deste mesmo lançamento. */
  readonly previousDecision: StatementDecisionAction | null;
  readonly fingerprint: string;
}

/** Contagens mostradas antes de confirmar. */
export interface StatementSummary {
  readonly totalExtracted: number;
  readonly movements: number;
  readonly balanceMarkers: number;
  readonly newCount: number;
  readonly exactDuplicates: number;
  readonly likelyDuplicates: number;
  readonly possibleDuplicates: number;
  readonly conflicts: number;
  readonly needsReview: number;
  readonly creditTotal: string;
  readonly debitTotal: string;
  /** Somado à parte: transferência não é receita nem despesa. */
  readonly transferTotal: string;
  readonly rejectedLines: number;
}

/** A prévia completa, antes de qualquer decisão. */
export interface StatementPreview {
  readonly previewToken: string;
  readonly expiresAt: string;
  readonly bankId: string;
  readonly accountId: string;
  readonly holderName: string | null;
  readonly periodStart: string | null;
  readonly periodEnd: string | null;
  readonly pageCount: number;
  readonly alreadyImportedFile: boolean;
  /** Confirmação fica bloqueada enquanto houver conflito sem decisão. */
  readonly blockedByConflicts: boolean;
  readonly summary: StatementSummary;
  readonly entries: readonly StatementEntry[];
  readonly rejected: readonly string[];
}

/** Uma decisão do usuário sobre uma linha. */
export interface StatementDecision {
  readonly lineIndex: number;
  readonly action: StatementDecisionAction;
  readonly matchedTransactionId?: string;
  readonly category?: string;
  readonly financialNature?: FinancialNature;
  readonly title?: string;
  readonly ignoreReason?: string;
}

/** O que a confirmação de fato fez. */
export interface StatementConfirmResult {
  readonly importedCount: number;
  readonly linkedCount: number;
  readonly ignoredCount: number;
  readonly skippedCount: number;
  readonly errors: readonly { readonly lineIndex: string; readonly reason: string }[];
}

/** Extensão aceita. Fora dela o backend responde 415. */
export const STATEMENT_ACCEPTED_EXTENSIONS = [".pdf"] as const;

/** Limite de upload do backend (413 acima disso). */
export const STATEMENT_MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Filtros da tabela de revisão. */
export const STATEMENT_FILTERS = [
  "all",
  "new",
  "exact",
  "likely",
  "ambiguous",
  "transfers",
  "income",
  "expense",
  "unclassified",
] as const;

export type StatementFilter = (typeof STATEMENT_FILTERS)[number];

/**
 * Filtros que dependem só do status de duplicidade.
 *
 * Separado do resto para manter cada função dentro do limite de complexidade
 * do projeto — e porque as duas perguntas são mesmo diferentes: uma é sobre o
 * que já existe no sistema, a outra sobre o que o lançamento é.
 *
 * @param entry Lançamento avaliado.
 * @param filter Filtro escolhido.
 * @returns True quando o filtro é de duplicidade e o lançamento passa; null
 *   quando o filtro não é desta família.
 */
const matchesDuplicateFilter = (
  entry: StatementEntry,
  filter: StatementFilter,
): boolean | null => {
  switch (filter) {
    case "new":
      return entry.matchStatus === "unique";
    case "exact":
      return entry.matchStatus === "exact";
    case "likely":
      return entry.matchStatus === "likely";
    case "ambiguous":
      return entry.matchStatus === "conflict" || entry.matchStatus === "possible";
    default:
      return null;
  }
};

/**
 * Filtros que dependem da natureza financeira do lançamento.
 *
 * `income` e `expense` excluem as naturezas neutras de propósito: uma
 * transferência entre contas próprias tem direção, mas não é receita nem
 * despesa, e listá-la sob esses rótulos é exatamente a confusão que a feature
 * existe para desfazer.
 *
 * @param entry Lançamento avaliado.
 * @param filter Filtro escolhido.
 * @returns True quando o filtro é de natureza e o lançamento passa; null
 *   quando o filtro não é desta família.
 */
const matchesNatureFilter = (
  entry: StatementEntry,
  filter: StatementFilter,
): boolean | null => {
  switch (filter) {
    case "transfers":
      return entry.isNeutralNature;
    case "income":
      return entry.direction === "credit" && !entry.isNeutralNature;
    case "expense":
      return entry.direction === "debit" && !entry.isNeutralNature;
    case "unclassified":
      return (
        entry.financialNature === "unclassified_in" ||
        entry.financialNature === "unclassified_out"
      );
    default:
      return null;
  }
};

/**
 * Decide se um lançamento entra num filtro.
 *
 * Fica no model, e não no componente, porque é regra de domínio: "ambíguo"
 * significa uma coisa específica, e essa definição não pode divergir entre a
 * tabela e o resumo.
 *
 * @param entry Lançamento avaliado.
 * @param filter Filtro escolhido.
 * @returns True quando o lançamento deve aparecer.
 */
export const matchesStatementFilter = (
  entry: StatementEntry,
  filter: StatementFilter,
): boolean =>
  matchesDuplicateFilter(entry, filter) ??
  matchesNatureFilter(entry, filter) ??
  true;

/**
 * Ação que será executada numa linha, considerando a decisão do usuário e, na
 * ausência dela, o que o sistema propõe.
 *
 * Uma duplicata exata já importada não é reoferecida; qualquer outra linha
 * começa como `import`, e o usuário desmarca o que não quiser — exceto
 * transferências e pagamentos de fatura, que começam desmarcados porque contá-los
 * como receita ou despesa é justamente o erro que a feature existe para evitar.
 *
 * @param entry Lançamento avaliado.
 * @param decision Decisão explícita do usuário, se houver.
 * @returns A ação efetiva, ou `null` quando a linha fica de fora.
 */
export const effectiveAction = (
  entry: StatementEntry,
  decision: StatementDecision | undefined,
): StatementDecisionAction | null => {
  if (decision) {
    return decision.action;
  }
  if (entry.kind === "balance_marker") {
    return null;
  }
  if (entry.matchStatus === "exact" || entry.matchStatus === "conflict") {
    return null;
  }
  if (entry.isNeutralNature) {
    return null;
  }
  return "import";
};

/**
 * Formata um valor monetário do extrato para exibição.
 *
 * A conversão para `number` acontece **apenas aqui**, na borda da
 * apresentação. O valor continua atravessando o sistema como string, que é a
 * forma exata que o backend produziu; converter mais cedo reintroduziria o
 * ponto flutuante que o `Decimal` do backend existe para evitar.
 *
 * @param raw Valor como o backend enviou, com sinal.
 * @returns O valor em formato brasileiro, ou o original se não for numérico.
 */
export const formatStatementAmount = (raw: string): string => {
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    return raw;
  }
  return CurrencyFormatter.format(parsed);
};
