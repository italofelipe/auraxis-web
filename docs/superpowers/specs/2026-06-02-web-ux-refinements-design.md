# Web UX Refinements — Design Spec

**Date:** 2026-06-02
**Epic:** [#984](https://github.com/italofelipe/auraxis-web/issues/984)
**Repo:** `auraxis-web` (Nuxt 4 + TS + Pinia + Vue Query + Naive UI)

## Goal

Fix a cluster of UX bugs and ship three design improvements on the web app: stop the token-refresh storm, deduplicate toasts, fix the mobile drawer/header, audit the wallet screen, surface historical insights on Transactions, and revamp the dashboard around a financial calendar.

## Decisions (locked with PO)

- Plan all 8 items as **one epic**, sequenced: bugs (1→4→6) → audit (5) → behavior (3) → design (2→7→8).
- Header mobile layout: **two-tier** (title row + dedicated Premium-badge row).
- Dashboard revamp: **calendar hero + comparatives** (remove low-value panels).
- Item 1 fix depth: **shared singleton HTTP client** (root cause).

## Items

### 1 — HTTP client singleton (#976) · `bug` `architecture` `p1`

**Problem:** `composables/useHttp/useHttp.ts` has 37 call sites; each builds its own Axios instance via `core/http/http-client.ts` → `core/api/interceptors.ts` → a per-instance `createSharedRefresh` single-flight guard. The guard only dedupes 401s _within_ one instance. On token expiry, the dashboard's parallel feature queries each fire their own `POST /auth/refresh`, tripping the `token_refresh` 10/min rate limit (`RATE_LIMIT_EXCEEDED`).

**Approach:** Memoize the HTTP client so all features share **one** Axios instance and therefore **one** global single-flight refresh. Implement via a module-level singleton keyed by app instance (or a Nuxt plugin providing the client). Session/refresh/dialog callbacks wire once. Feature `*.client.ts` factories keep their `new XClient(useHttp())` shape — they just receive the shared instance.

**Notes:** Delete macOS duplicate `features/simulations/services/simulation-quota.client 2.ts`.

### 2 — Two-tier responsive header (#981) · `enhancement` `ux` `design-system` `p2`

**Problem:** `components/ui/UiTopbar/UiTopbar.vue` is a single flex row with no mobile layout; `UiPageHeader` title stays full-size and squeezes Premium badge + theme toggle + avatar under 768px.

**Approach:** Below 768px, render two rows — row 1: hamburger + smaller title/subtitle + theme + avatar; row 2: full Premium badge (from the `topbar-extras` slot). Desktop layout unchanged.

### 3 — Transactions: today insight + past-insights accordion (#980) · `enhancement` `p2`

**Problem:** Transactions doesn't show previously generated insights.

**Approach:** Reuse `AiInsightSurface` + `features/ai-insights/queries/use-ai-insights-history.ts` + `AiInsightAccordionItem`. If a today-insight exists → show it on top, past insights in an accordion below. If not → alternative copy + the past-insights accordion. History only on load (no `generate` call).

### 4 — Single toast (#977) · `bug` `ux` `p1`

**Problem:** `useToast` wraps Naive UI `useMessage`, which has no dedup/max. Concurrent failures stack identical toasts (8× seen on token expiry).

**Approach:** `NMessageProvider :max="1"` in `app.vue` + content-dedup in `useToast` (suppress if identical severity+text already active) + idempotent session-expiry `dialog.warning` guard in `useHttp`.

### 5 — Wallet audit (#979) · `bug` `wallet` `p2`

**Problem:** `pages/portfolio.vue` ("Carteira") suspected of hardcoded values + dead CTAs.

**Approach:** Audit `pages/portfolio.vue` (34 KB) and `components/wallet/*`. Replace hardcoded values with real data or honest empty/loading states (no placeholder in nominal flow). Wire or remove dead buttons/links. Deliver a findings report.

### 6 — Drawer closes on nav + page transition (#978) · `bug` `ux` `p1`

**Problem:** `components/ui/UiAppShell/UiAppShell.vue` only closes the mobile drawer on overlay click — not on navigation. No route transition.

**Approach:** `watch(() => route.path, () => closeDrawer())` in `UiAppShell`. Add a Nuxt `pageTransition` (fade/slide).

### 7 — Dashboard revamp (#982) · `enhancement` `dashboard` `p2`

**Problem:** `features/dashboard/components/DashboardMarketPulseWorkspace.vue` renders "Transações Recentes" (mislabeled upcoming dues, with a **dead** search box + Filter button) and "Anomalias Detectadas" (usually empty). KPIs + cashflow + categories are good.

**Approach:** Remove the two low-value panels; keep KPIs/cashflow/categories; add the `FinancialCalendar` as the lower hero + a month-over-month comparatives/alerts strip using real `comparison`/`alerts`/`upcomingDues`.

### 8 — Financial calendar widget on dashboard (#983) · `enhancement` `dashboard` `p2`

**Problem:** No calendar widget on the dashboard.

**Approach:** Reuse `components/financial-calendar/FinancialCalendar` + `CalendarDayDetail` + `features/transactions/composables/useFinancialCalendar.ts` (already on the Transactions page), sized large. Show each day's transactions (realized + due); click day → `CalendarDayDetail` modal with that day's incomes/expenses and paid/received status. Premium gating mirrors the Transactions page.

## Dependencies

- #983 depends on the layout slot from #982 → land together or #983 first, #982 composes it.
- #976 removes refresh noise → cleaner testing of #980/#982/#983.
- All others independent.

## Quality gates (every PR)

- `pnpm quality-check` green; coverage ≥ 85% (lines/functions/statements/branches).
- TDD for model/query/composable/service logic per `app/features/CLAUDE.md`.
- PR body includes `Closes #<n>`; `auto-merge` per repo policy.
