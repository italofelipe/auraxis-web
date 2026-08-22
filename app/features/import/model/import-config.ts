/** Flag que controla a entrada do import CSV/XLSX no web. */
export const IMPORT_FEATURE_FLAG_KEY = "web.import.csv-xlsx";

/**
 * Flag da aba de extrato bancário.
 *
 * Deliberadamente separada da flag da planilha: as maturidades são opostas (o
 * wizard de planilha já está em produção) e desligar o extrato não pode
 * derrubar junto o import de CSV/XLSX.
 */
export const BANK_IMPORT_FEATURE_FLAG_KEY = "web.import.bank-statement";

/**
 * Flag da aba de extrato em PDF.
 *
 * Terceira flag, e não uma extensão da anterior, pelo mesmo motivo que separou
 * as duas primeiras: o caminho do PDF depende de uma migration e de mudanças no
 * v1 que ainda não estão em produção, e desligá-lo não pode derrubar o import
 * de OFX nem o de planilha.
 */
export const STATEMENT_IMPORT_FEATURE_FLAG_KEY = "web.import.statement-pdf";
