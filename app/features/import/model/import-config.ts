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
