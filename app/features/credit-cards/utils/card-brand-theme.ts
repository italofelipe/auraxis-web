import type { CreditCardBrand, CreditCardDto } from "../contracts/credit-card.dto";

/** Par de cores de um gradiente 135° usado na face/spine de um cartão. */
export interface CardTheme {
  readonly color: string;
  readonly color2: string;
}

/**
 * Cores aproximadas por bandeira (fallback quando o banco não é reconhecido).
 * Usadas no spine do cartão, na barra de utilização e nas séries de gráficos.
 */
export const CARD_BRAND_THEME: Record<CreditCardBrand, CardTheme> = {
  visa:       { color: "#1A1F71", color2: "#2D4BD8" },
  mastercard: { color: "#EB001B", color2: "#F79E1B" },
  elo:        { color: "#211915", color2: "#E5322D" },
  hipercard:  { color: "#B3131B", color2: "#E5322D" },
  amex:       { color: "#1F72CD", color2: "#2E97D4" },
  other:      { color: "#33485A", color2: "#5A6B7B" },
};

/**
 * Cores por banco conhecido — mais vivas e fiéis ao handoff. O nome do banco
 * (`CreditCardDto.bank`) é texto livre, então normalizamos antes de comparar.
 */
const BANK_THEME: Record<string, CardTheme> = {
  "nubank":          { color: "#820AD1", color2: "#5B0A92" },
  "inter":           { color: "#FF7A00", color2: "#FF5500" },
  "banco inter":     { color: "#FF7A00", color2: "#FF5500" },
  "mercado pago":    { color: "#00A6E6", color2: "#0066CC" },
  "mercadopago":     { color: "#00A6E6", color2: "#0066CC" },
  "santander":       { color: "#EC0000", color2: "#B30000" },
  "itau":            { color: "#EC7000", color2: "#003399" },
  "itaú":            { color: "#EC7000", color2: "#003399" },
  "itau unibanco":   { color: "#EC7000", color2: "#003399" },
  "bradesco":        { color: "#CC092F", color2: "#7A0019" },
  "c6":              { color: "#242424", color2: "#3F3F3F" },
  "c6 bank":         { color: "#242424", color2: "#3F3F3F" },
  "caixa":           { color: "#0070AF", color2: "#005A8C" },
  "banco do brasil": { color: "#F2C200", color2: "#0033A0" },
  "bb":              { color: "#F2C200", color2: "#0033A0" },
};

/**
 * Normaliza um nome de banco para casar com `BANK_THEME`.
 *
 * @param bank Nome livre do banco (pode ser null).
 * @returns Nome em minúsculas e sem espaços nas pontas.
 */
const normalizeBank = (bank: string | null | undefined): string =>
  (bank ?? "").trim().toLowerCase();

/**
 * Resolve o tema de cor de um cartão: banco conhecido → bandeira → "other".
 *
 * @param card Cartão (apenas `brand` e `bank` são usados).
 * @returns Par de cores do cartão.
 */
export const resolveCardTheme = (
  card: Pick<CreditCardDto, "brand" | "bank">,
): CardTheme => {
  const byBank = BANK_THEME[normalizeBank(card.bank)];
  if (byBank) {
    return byBank;
  }
  return CARD_BRAND_THEME[card.brand ?? "other"];
};

/**
 * Paleta categórica estável usada quando uma categoria (tag) não tem cor.
 * Cores funcionam tanto no tema claro quanto no escuro.
 */
export const CATEGORY_FALLBACK_PALETTE: readonly string[] = [
  "#11A36B",
  "#2E7CF6",
  "#9B5DE5",
  "#F15BB5",
  "#FF8A3D",
  "#E5484D",
  "#00BBD6",
  "#7C8B99",
];

/**
 * Cor de uma categoria: usa a cor da tag quando definida; caso contrário,
 * escolhe uma cor estável da paleta pelo índice (determinístico).
 *
 * @param color Cor da tag (`TagDto.color`), possivelmente null.
 * @param index Índice estável da categoria (para o fallback).
 * @param palette Paleta de fallback (default = `CATEGORY_FALLBACK_PALETTE`).
 * @returns Cor CSS resolvida.
 */
export const categoryColor = (
  color: string | null | undefined,
  index: number,
  palette: readonly string[] = CATEGORY_FALLBACK_PALETTE,
): string => {
  if (typeof color === "string" && color.trim().length > 0) {
    return color.trim();
  }
  const safeIndex = ((index % palette.length) + palette.length) % palette.length;
  return palette[safeIndex] ?? palette[0] ?? "#7C8B99";
};
