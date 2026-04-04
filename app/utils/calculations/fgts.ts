/**
 * @module calculations/fgts
 *
 * Pure financial calculation functions for FGTS (Fundo de Garantia do Tempo de Serviço).
 *
 * Covers:
 * - Monthly deposit: 8% of gross salary (Art. 15 Lei 8.036/1990)
 * - Balance correction: TR + 3% p.a. (Art. 13 Lei 8.036/1990)
 * - Termination fines:
 *   - sem_justa_causa: 40% on balance (Art. 18 §1 Lei 8.036/1990)
 *   - acordo: 20% on balance (Art. 20 XXIII Lei 8.036/1990; Lei 13.467/2017)
 *   - pedido_demissao / justa_causa: 0% fine, no withdrawal
 * - Withdrawal eligibility (saque-aniversário, illness, home purchase etc.)
 *
 * All functions are pure: no side effects, no Vue reactivity.
 * Source of truth for WEB36 unit tests.
 */

/* v8 ignore start */
export * from "~/features/tools/model/fgts";
/* v8 ignore stop */
