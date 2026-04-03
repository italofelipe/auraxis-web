/**
 * @module calculations
 *
 * Public API for all Auraxis financial calculation functions.
 *
 * Domain namespaces:
 * - `payroll`     — CLT payroll: INSS, IRRF, 13º, férias, hora extra, rescisão
 * - `tax`         — Tax regimes: MEI DAS, CLT vs PJ
 * - `investments` — Fixed income and equity: juros compostos, CDB/LCI/LCA, Tesouro Direto, FII
 * - `planning`    — Long-term planning: aposentadoria, FIRE, financiamento, aluguel vs compra
 * - `fgts`        — FGTS deposit simulation and termination scenarios
 * - `utility`     — General finance utilities: dividir conta, desconto/markup, conversor, parcelas
 *
 * @example
 * import * as payroll from '~/utils/calculations/payroll';
 * const result = payroll.calculateThirteenthSalary(form);
 *
 * @example
 * import { calculateFire } from '~/utils/calculations/planning';
 */

export * as payroll from "./payroll";
export * as tax from "./tax";
export * as investments from "./investments";
export * as planning from "./planning";
export * as fgts from "./fgts";
export * as utility from "./utility";
