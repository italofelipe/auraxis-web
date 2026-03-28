/**
 * Brazilian document and contact validators for the Auraxis web application.
 *
 * All functions accept raw or masked input (digits and non-digits) — they
 * strip non-digit characters before running validation logic.
 */

/**
 * Computes a CPF check digit from `digits` using the modulo-11 algorithm.
 *
 * @param digits Full CPF digit string (11 chars).
 * @param length Number of leading digits to include in the weighted sum.
 * @returns Expected check digit (0–9).
 */
const cpfCheckDigit = (digits: string, length: number): number => {
  let sum = 0;
  for (let i = 0; i < length; i++) {
    sum += Number(digits[i]) * (length + 1 - i);
  }
  const remainder = (sum * 10) % 11;
  return remainder >= 10 ? 0 : remainder;
};

/**
 * Returns `true` when `cpf` is a structurally valid Brazilian CPF number.
 *
 * Accepts masked input (e.g. `"123.456.789-09"`) or raw digits.
 * Rejects sequences where all digits are the same (e.g. `"111.111.111-11"`).
 *
 * @param cpf CPF string to validate (masked or raw).
 * @returns `true` if the CPF passes the modulo-11 check.
 *
 * @example
 * isCPF("529.982.247-25")  // true
 * isCPF("111.111.111-11")  // false (all same digit)
 * isCPF("12345678900")     // false (invalid check digits)
 */
export const isCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) { return false; }
  if (/^(.)\1+$/.test(digits)) { return false; }
  return (
    cpfCheckDigit(digits, 9) === Number(digits[9]) &&
    cpfCheckDigit(digits, 10) === Number(digits[10])
  );
};

/**
 * Computes a CNPJ check digit from `digits` using the modulo-11 algorithm.
 *
 * @param digits Full CNPJ digit string (14 chars).
 * @param length Number of leading digits to include in the weighted sum.
 * @returns Expected check digit (0–9).
 */
const cnpjCheckDigit = (digits: string, length: number): number => {
  const weights =
    length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const sum = weights.reduce((acc, w, i) => acc + Number(digits[i]) * w, 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
};

/**
 * Returns `true` when `cnpj` is a structurally valid Brazilian CNPJ number.
 *
 * Accepts masked input (e.g. `"11.222.333/0001-81"`) or raw digits.
 * Rejects sequences where all digits are the same.
 *
 * @param cnpj CNPJ string to validate (masked or raw).
 * @returns `true` if the CNPJ passes the modulo-11 check.
 *
 * @example
 * isCNPJ("11.222.333/0001-81")  // true
 * isCNPJ("00.000.000/0000-00")  // false (all same digit)
 */
export const isCNPJ = (cnpj: string): boolean => {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) { return false; }
  if (/^(.)\1+$/.test(digits)) { return false; }
  return (
    cnpjCheckDigit(digits, 12) === Number(digits[12]) &&
    cnpjCheckDigit(digits, 13) === Number(digits[13])
  );
};

/**
 * Returns `true` when `phone` is a structurally valid Brazilian phone number.
 *
 * Accepts masked or raw input. Validates:
 * - DDD: `11`–`99`
 * - Mobile: 11 digits total (3rd digit must be `9`)
 * - Landline: 10 digits total (3rd digit must be `2`–`8`)
 *
 * @param phone Phone string to validate (masked or raw).
 * @returns `true` if the number matches a valid Brazilian phone format.
 *
 * @example
 * isPhone("(11) 91234-5678")  // true  (mobile)
 * isPhone("(11) 3456-7890")   // true  (landline)
 * isPhone("00912345678")      // false (invalid DDD)
 */
export const isPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) { return false; }

  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) { return false; }

  const thirdDigit = digits[2] ?? "";
  if (digits.length === 11) { return thirdDigit === "9"; }
  return /^[2-8]$/.test(thirdDigit);
};
