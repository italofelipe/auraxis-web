# Wallet ("Carteira") audit — `pages/portfolio.vue` + `components/wallet/*`

Issue: #979 — [WEB] audit: Carteira (portfolio.vue) — remover hardcoded + CTAs sem ação
Branch: `fix/979-wallet-audit`
Date: 2026-06-02

## Method

1. Grep for displayed numeric/financial values and interactive controls in
   `pages/portfolio.vue` and `components/wallet/*.vue`.
2. Trace each rendered value back to its source (query / computed / literal).
3. Confirm which backend fields are actually available
   (`WalletClient.getPortfolioSummary` → `GET /wallet/valuation`,
   `getEntries` → `GET /wallet`, `getWalletHistory` → per-entry valuation).
4. Classify each finding and decide: wire / replace-with-empty-state / remove.

## Backend reality (what data actually exists)

`GET /wallet/valuation` (mapped in `wallet.client.ts:162-176`) provides ONLY:

| Field                  | Source                              |
| ---------------------- | ----------------------------------- |
| `total_value`          | `summary.total_current_value`       |
| `total_cost`           | `summary.total_invested_amount`     |
| `total_return_percent` | `summary.total_profit_loss_percent` |
| `asset_count`          | `summary.total_investments`         |
| `day_change_percent`   | **not provided → mapped to `null`** |

`GET /wallet` provides per-asset entries (incl. per-asset `change_percent`).
There is **no** portfolio-wide historical series, **no** monthly/yearly return
breakdown, and **no** benchmark (Ibovespa / CDI) data anywhere in the contract.

## Findings — displayed values

| file:line                                                | Current value / behavior                                                                                                | Classification                                                                                                                                                                                                     | Decision                                                                                                                        |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `portfolio.vue:90`                                       | `day_change_percent: 0.84` in nominal `computedSummary` fallback (entries present, summary absent)                      | **NOT OK** — fabricated literal in nominal flow (not currently rendered on this page, but a fabricated value baked into a computed)                                                                                | Replace with `null` (honest "unknown")                                                                                          |
| `portfolio.vue:263`                                      | `monthlyReturnAmount = total_value * 0.0365`                                                                            | **NOT OK** — invented 3,65%/mo multiplier rendered as "Rentabilidade (Mês)"                                                                                                                                        | Remove KPI card (no backend source)                                                                                             |
| `portfolio.vue:264`                                      | `yearlyReturnAmount = max(return, total_value * 0.145)`                                                                 | **NOT OK** — invented 14,5% floor rendered as "Rentabilidade (Ano)"                                                                                                                                                | Remove KPI card (no backend source)                                                                                             |
| `portfolio.vue:529`                                      | `3,20%` literal (month-vs-benchmark pill)                                                                               | **NOT OK** — hardcoded                                                                                                                                                                                             | Remove (part of removed card)                                                                                                   |
| `portfolio.vue:531`                                      | `vs. Ibovespa (1,50%)` literal                                                                                          | **NOT OK** — hardcoded benchmark                                                                                                                                                                                   | Remove (no benchmark data)                                                                                                      |
| `portfolio.vue:546`                                      | `14,50%` literal (year-vs-benchmark pill)                                                                               | **NOT OK** — hardcoded                                                                                                                                                                                             | Remove (part of removed card)                                                                                                   |
| `portfolio.vue:548`                                      | `vs. CDI (6,20%)` literal                                                                                               | **NOT OK** — hardcoded benchmark                                                                                                                                                                                   | Remove (no benchmark data)                                                                                                      |
| `portfolio.vue:312`                                      | performance series `base*(1 + i*0.031 + sin(i)*0.012)`                                                                  | **NOT OK** — synthetic 12-month curve presented as "Evolução Patrimonial vs benchmark"                                                                                                                             | Remove the synthetic-history chart (no portfolio history endpoint)                                                              |
| `portfolio.vue:313`                                      | benchmark series `base*(1 + i*0.014)`                                                                                   | **NOT OK** — synthetic benchmark                                                                                                                                                                                   | Remove (part of removed chart)                                                                                                  |
| `portfolio.vue:589`                                      | `<strong>100%</strong>` allocation-total label                                                                          | OK — static design label inside donut center (allocation always sums to 100% by definition; the slices come from real `allocationRows`)                                                                            | Keep                                                                                                                            |
| `portfolio.vue:541`                                      | `<span class="kpi-year">2026</span>`                                                                                    | OK after change — was static; will bind to current year                                                                                                                                                            | Wire to `new Date().getFullYear()` (kept only if year card survives — card removed, so N/A)                                     |
| `portfolio.vue:496,500,519,539`                          | `formatCurrency(computedSummary.total_value)`, `formatPercent(total_return_percent)` etc.                               | OK — bound to query-backed `computedSummary`                                                                                                                                                                       | Keep (519/539 removed with their cards)                                                                                         |
| `portfolio.vue:272`                                      | `projectedMonthlyContribution = max(500, total_value*0.012)` feeding `NetWorthTimeline`                                 | **Borderline** — heuristic, but it is a _projection input_ to a forward-looking simulator (not a reported actual), and `NetWorthTimeline` is an explicit projection widget. Still, the 1.2%/floor-500 is invented. | Remove — `NetWorthTimeline` already defaults `monthly-contribution` to `0`; pass real `0` rather than an invented contribution. |
| `portfolio.vue:312` base / allocation rows / table cells | `allocationRows`, `averageCost`, `currentQuote`, `entryAllocationPercent`, `totalReturnPercent`, table `change_percent` | OK — all derived from real `entries` query                                                                                                                                                                         | Keep                                                                                                                            |
| `components/wallet/PositionsList.vue:23`                 | `toFixed(2)` in `formatPercent`                                                                                         | OK — formats a passed-in value, not a literal                                                                                                                                                                      | Keep                                                                                                                            |
| `components/wallet/WalletSummaryCard.vue:23`             | `toFixed(2)` in `formatPercent`                                                                                         | OK — formats a passed-in value                                                                                                                                                                                     | Keep                                                                                                                            |

> Note: `components/wallet/PositionsList.vue` and `WalletSummaryCard.vue` are
> NOT imported by `portfolio.vue` (the page renders its own table/KPIs). They
> receive all data via props and contain no hardcoded financial literals.
> Mock data in `features/portfolio/mock/portfolio.mock.ts` is gated behind
> `NUXT_PUBLIC_MOCK_DATA` (dev/test only) — legitimate, not nominal-flow.

## Findings — interactive elements

| file:line                             | Control                        | Has action?                                 | Decision                                                                       |
| ------------------------------------- | ------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------ |
| `portfolio.vue:425`                   | "Abrir menu" hamburger button  | No `@click`                                 | Remove — global layout already provides nav; this is a dead prototype control. |
| `portfolio.vue:437`                   | "Buscar ativo..." search input | No binding/handler                          | Remove — no search feature exists for this page.                               |
| `portfolio.vue:439`                   | Notifications bell button      | No `@click`                                 | Remove — no notifications feature on this page.                                |
| `portfolio.vue:443`                   | "Exportar" button              | No `@click`                                 | Remove — no export implemented.                                                |
| `portfolio.vue:504`                   | "Aportar" button               | `@click="showEntryForm = true"`             | Keep — real action.                                                            |
| `portfolio.vue:508`                   | "Resgatar" button              | No `@click`                                 | Remove — no redeem/sell flow exists.                                           |
| `portfolio.vue:521`                   | Month `<select>` (Maio/Abril)  | No binding                                  | Removed with the monthly KPI card.                                             |
| `portfolio.vue:571-574`               | Range tabs 1M/6M/1A/TUDO       | No `@click` (only static `is-active` on 1A) | Removed with the synthetic performance chart.                                  |
| `portfolio.vue:616`                   | Position filter `<select>`     | No binding                                  | Remove — filtering not wired; the table shows all entries.                     |
| `portfolio.vue:471-474` (empty state) | `action`/`secondary-href`      | Real (`@action` opens form, href `/tools`)  | Keep.                                                                          |

## Summary of decisions

- **Remove** (fabricated / no data source): monthly KPI card, yearly KPI card,
  both benchmark pills, the synthetic "Evolução Patrimonial" performance chart +
  its range tabs, the invented `projectedMonthlyContribution`.
- **Fix to honest value**: `day_change_percent` literal → `null`.
- **Remove dead CTAs**: hamburger, search box, notifications bell, "Exportar",
  "Resgatar", position filter select.
- **Keep** (real, query-backed): Patrimônio Total KPI, total-return pill,
  "Aportar", allocation donut + list, detailed positions table, AI insight
  surface, `NetWorthTimeline` (real projection — now fed `monthly-contribution=0`),
  empty state, error/loading states.

## Outcome

PO suspicion **confirmed**. Multiple fabricated financial values and several
dead CTAs in the nominal flow. Fixed per decisions above; no placeholder numbers
remain in the nominal flow.
