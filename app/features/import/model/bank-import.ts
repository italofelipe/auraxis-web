/** Tipos de domínio do import de extrato bancário (`/v2/bank-import/*`). */

import type { ImportTransactionType } from "~/features/import/model/import";

export type BankImportFileType = "ofx" | "qfx" | "febraban_240" | "csv";

/** Bancos com mapeamento de CSV no api-v2. */
export const BANK_IMPORT_BANK_IDS = ["nubank", "inter", "c6", "itau", "xp"] as const;

export type BankImportBankId = (typeof BANK_IMPORT_BANK_IDS)[number];

export interface BankTransactionDraft {
  readonly id: string;
  readonly date: string;
  readonly description: string;
  /** Valor absoluto, já sem o sinal — o sinal virou `type`. */
  readonly amount: string;
  readonly type: ImportTransactionType;
  readonly isDuplicate: boolean;
}

export interface BankImportPreview {
  readonly previewToken: string;
  readonly expiresAt: string;
  readonly fileType: BankImportFileType;
  readonly bankId: BankImportBankId | null;
  readonly totalCount: number;
  readonly duplicatesCount: number;
  readonly transactions: readonly BankTransactionDraft[];
}

export interface BankImportUploadCommand {
  readonly file: File;
  /** Obrigatório para `.csv`; ignorado nos demais formatos. */
  readonly bankId: BankImportBankId | null;
}

export interface BankImportConfirmCommand {
  readonly previewToken: string;
  readonly excludeIds: readonly string[];
}

/**
 * Extensões aceitas pelo `_detect_file_type` do api-v2. Fora dessa lista o
 * backend responde 415 — validar aqui evita a ida ao servidor.
 */
export const BANK_IMPORT_ACCEPTED_EXTENSIONS = [
  ".ofx",
  ".qfx",
  ".ret",
  ".csv",
] as const;

/** Limite de upload do backend (413 acima disso). */
export const BANK_IMPORT_MAX_FILE_BYTES = 10 * 1024 * 1024;

/**
 * Só o CSV precisa do banco: OFX, QFX e FEBRABAN trazem o layout no próprio
 * arquivo. Perguntar antes de subir evita as duas cotas freemium que o fluxo
 * "sobe cego → `requires_confirmation` → sobe de novo" consumiria.
 *
 * @param file Arquivo escolhido pelo usuário.
 * @returns True quando o wizard precisa perguntar o banco antes do upload.
 */
export const bankImportNeedsBankChoice = (file: File): boolean =>
  file.name.toLowerCase().endsWith(".csv");
