import type {
  BankConfirmResponseDto,
  BankTransactionViewDto,
  BankUploadResponseDto,
} from "~/features/import/contracts/bank-import.dto";
import {
  BANK_IMPORT_BANK_IDS,
  type BankImportBankId,
  type BankImportPreview,
  type BankTransactionDraft,
} from "~/features/import/model/bank-import";
import type { ImportConfirmResult } from "~/features/import/model/import";

/**
 * Converte um banco cru para o domínio, descartando o que a UI não conhece.
 *
 * O backend pode ganhar um mapeamento novo antes do web; deixar o id passar
 * cru quebraria o rótulo (viraria `undefined` na tela) sem nenhum aviso.
 *
 * @param raw Id de banco devolvido pelo backend.
 * @returns Banco conhecido, ou null.
 */
const toBankId = (raw: string | null | undefined): BankImportBankId | null =>
  BANK_IMPORT_BANK_IDS.find((bank) => bank === raw) ?? null;

/**
 * Converte uma linha do extrato.
 *
 * O extrato não tem coluna de tipo: o sinal do valor é a única fonte. Zero
 * conta como entrada — não existe "despesa de R$ 0,00" que valha exibir como
 * saída, e o backend usa `amount > 0` no mesmo lugar (`service._to_drafts`).
 *
 * @param dto Linha crua do backend.
 * @returns Draft do domínio, com o valor já sem sinal.
 */
export const mapBankTransactionView = (
  dto: BankTransactionViewDto,
): BankTransactionDraft => {
  // O valor volta como string por escolha do backend (Decimal serializado).
  // Reconstruir a partir do `Number` comeria os zeros à direita — "149.90"
  // viraria "149.9" e o extrato deixaria de bater com o do banco na conferência
  // visual do usuário. Só o sinal sai; o resto do texto é preservado.
  const raw = typeof dto.amount === "string" ? dto.amount.trim() : String(dto.amount);
  const parsed = Number(raw);
  const isNumeric = raw.length > 0 && Number.isFinite(parsed);

  return {
    id: dto.id,
    date: dto.date,
    description: dto.description,
    amount: isNumeric ? raw.replace(/^[+-]/, "") : "0",
    type: isNumeric && parsed < 0 ? "expense" : "income",
    isDuplicate: dto.is_duplicate,
  };
};

/**
 * Converte a resposta do upload (e a do preview, que tem o mesmo shape).
 *
 * `reconciled_count` é ignorado de propósito: `reconciliation.py` devolve `[]`
 * por design, então exibir "conciliadas" seria sempre zero e mentiria sobre o
 * que o produto faz.
 *
 * @param dto Resposta crua do backend.
 * @returns Preview do domínio.
 */
export const mapBankUploadResponse = (
  dto: BankUploadResponseDto,
): BankImportPreview => {
  const transactions = dto.transactions.map(mapBankTransactionView);

  return {
    previewToken: dto.preview_token,
    expiresAt: dto.expires_at,
    fileType: dto.file_type,
    bankId: toBankId(dto.bank_id) ?? toBankId(dto.detected_bank_id),
    // Derivar das linhas mantém o resumo coerente com o que a tabela mostra.
    // O backend calcula os dois em cima da mesma lista, então não há perda —
    // e o GET /preview já recalcula por conta própria.
    totalCount: transactions.length,
    duplicatesCount: transactions.filter((draft) => draft.isDuplicate).length,
    transactions,
  };
};

/**
 * Converte a resposta do confirm.
 *
 * @param dto Resposta crua do backend.
 * @param fallbackSkipped Contagem usada quando o backend omite `skipped_count`.
 * @returns Resultado do import no domínio, no mesmo shape do wizard de planilha.
 */
export const mapBankConfirmResponse = (
  dto: BankConfirmResponseDto,
  fallbackSkipped: number,
): ImportConfirmResult => ({
  importedCount: dto.imported_count,
  skippedCount: dto.skipped_count ?? fallbackSkipped,
  errors: (dto.errors ?? []).map((error) => ({
    draftId: error.draft_id,
    reason: error.reason,
  })),
});
