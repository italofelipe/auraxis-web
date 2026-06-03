# Web UX Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the token-refresh storm, toast stacking, mobile drawer/header, audit the wallet screen, surface historical insights on Transactions, and revamp the dashboard around a financial calendar.

**Architecture:** Eight independent units, each one issue → one branch → one PR with `Closes #n`. Shared infra fix (HTTP singleton) lands first to de-noise testing. Reuse existing components (`FinancialCalendar`, `AiInsightSurface`, `use-ai-insights-history`) wherever possible.

**Tech Stack:** Nuxt 4, TypeScript (strict), Pinia, TanStack Vue Query, Naive UI, Vitest, axios + axios-retry, ECharts (`UiChart`).

**Conventions (all tasks):**

- Branch: `{type}/{issue}-{slug}` (e.g. `fix/976-http-singleton`).
- Commit: Conventional Commits, no `Co-Authored-By`.
- Before each PR: `pnpm quality-check` green, coverage ≥ 85%.
- PR body: `Closes #<n>`; merge with `gh pr merge <n> --merge --auto`.
- TDD mandatory for `model/`, `queries/`, `composables/`, `services/` per `app/features/CLAUDE.md`.

---

## Task Group 1 — HTTP client singleton (#976)

**Branch:** `fix/976-http-singleton`

**Files:**

- Modify: `app/composables/useHttp/useHttp.ts`
- Test: `app/composables/useHttp/useHttp.spec.ts`
- Delete: `app/features/simulations/services/simulation-quota.client 2.ts`

**Root cause recap:** `useHttp()` calls `createHttpClient()` on every invocation (37 call sites), each producing a fresh Axios instance + fresh `createSharedRefresh` closure (in `core/api/interceptors.ts`). The single-flight refresh guard therefore never spans clients. Fix: memoize so all callers share one instance.

- [ ] **Step 1: Read the current wiring**

Read `app/composables/useHttp/useHttp.ts`, `app/core/http/http-client.ts`, `app/core/api/interceptors.ts` (already summarised in the spec). Confirm `useHttp()` returns `createHttpClient(apiBase, getToken, callbacks)` with no memoization.

- [ ] **Step 2: Write the failing test — same instance across calls**

Add to `app/composables/useHttp/useHttp.spec.ts`:

```ts
it("returns the same Axios instance across multiple calls (shared single-flight)", () => {
  const a = useHttp();
  const b = useHttp();
  expect(a).toBe(b);
});
```

- [ ] **Step 3: Run it — expect FAIL**

Run: `pnpm test -- composables/useHttp`
Expected: FAIL (`a` and `b` are different instances).

- [ ] **Step 4: Memoize the client**

In `useHttp.ts`, hold the instance in a module-level cache keyed by the resolved `apiBase`. The interceptor callbacks (`useMessage`, `useDialog`, `useI18n`, `useSessionStore`, gate) are captured once on first creation. Sketch:

```ts
let cachedClient: AxiosInstance | null = null;

export const useHttp = (): AxiosInstance => {
  if (cachedClient) {
    return cachedClient;
  }
  const runtimeConfig = useRuntimeConfig();
  // ...existing setup (sessionStore, message, dialog, t, apiBase)...
  const client = createHttpClient(apiBase, () => sessionStore.getAccessToken(), {
    /* existing callbacks */
  });
  client.interceptors.request.use(/* existing impersonation guard */);
  cachedClient = client;
  return cachedClient;
};
```

Note: `getAccessToken` stays a lazy callback so the memoized client always reads the live token. Export a `__resetHttpClientForTests()` that nulls `cachedClient` and call it in the spec's `beforeEach` so tests stay isolated.

- [ ] **Step 5: Run the test — expect PASS**

Run: `pnpm test -- composables/useHttp`
Expected: PASS, and existing useHttp tests still green (reset cache in `beforeEach`).

- [ ] **Step 6: Write the single-flight regression test**

Add a test that two concurrent 401s through the shared client trigger `onUnauthorized` exactly once (mock `refreshAccessToken` / the refresh endpoint; fire two requests; assert one refresh call). This proves the stampede guard now spans callers.

- [ ] **Step 7: Run it — expect PASS**

Run: `pnpm test -- composables/useHttp`

- [ ] **Step 8: Delete the macOS duplicate file**

```bash
git rm "app/features/simulations/services/simulation-quota.client 2.ts"
```

- [ ] **Step 9: Full gate + commit**

```bash
pnpm quality-check
git add app/composables/useHttp/useHttp.ts app/composables/useHttp/useHttp.spec.ts
git commit -m "fix(http): share a single Axios instance so token refresh is single-flight (#976)"
```

- [ ] **Step 10: Open PR**

```bash
gh pr create --fill --base master --head fix/976-http-singleton --body "Closes #976"
gh pr merge --merge --auto
```

**AC verification:** With devtools open on the dashboard, force a token expiry → observe exactly one `POST /auth/refresh`, no `RATE_LIMIT_EXCEEDED`.

---

## Task Group 2 — Single toast: dedup + max 1 (#977)

**Branch:** `fix/977-single-toast`

**Files:**

- Modify: `app/app.vue` (NMessageProvider `:max`)
- Modify: `app/composables/useToast/useToast.ts`
- Test: `app/composables/useToast/useToast.spec.ts`
- Modify: `app/composables/useHttp/useHttp.ts` (idempotent session dialog)

- [ ] **Step 1: Cap visible messages**

In `app/app.vue`, find `<NMessageProvider>` and add `:max="1"` (and keep existing placement). If it's configured via `n-message-provider` options elsewhere, set `max: 1` there.

- [ ] **Step 2: Write the failing dedup test**

In `app/composables/useToast/useToast.spec.ts`:

```ts
it("suppresses a duplicate active message with the same severity+text", () => {
  const { error } = useToast();
  error("Sessão expirada.");
  error("Sessão expirada.");
  expect(messageMock.error).toHaveBeenCalledTimes(1);
});

it("allows the same text again after the previous one is dismissed", () => {
  const { error } = useToast();
  const first = error("Falhou."); // returns a handle/disposer
  first?.destroy?.(); // simulate dismissal
  error("Falhou.");
  expect(messageMock.error).toHaveBeenCalledTimes(2);
});
```

(Adjust the Naive UI `useMessage` mock to return an object with a `destroy` spy.)

- [ ] **Step 3: Run it — expect FAIL**

Run: `pnpm test -- composables/useToast`

- [ ] **Step 4: Implement dedup**

In `useToast.ts`, track active keys (`${severity}:${msg}`) in a module-level `Set`. On each helper: if the key is active, return without calling Naive UI. Otherwise call Naive UI, add the key, and remove it when the returned message reactive `destroy`s / after `duration + 50ms`. Keep the `:max="1"` cap as the visual backstop.

- [ ] **Step 5: Run it — expect PASS**

Run: `pnpm test -- composables/useToast`

- [ ] **Step 6: Idempotent session-expiry dialog**

In `useHttp.ts` `onUnauthorized`, guard the `dialog.warning(...)` behind a module-level `isSessionDialogOpen` flag set true before opening and reset on `onPositiveClick`/close, so concurrent refresh failures open the dialog once.

- [ ] **Step 7: Run gate + commit**

```bash
pnpm quality-check
git add app/app.vue app/composables/useToast/useToast.ts app/composables/useToast/useToast.spec.ts app/composables/useHttp/useHttp.ts
git commit -m "fix(toast): dedup identical toasts and cap to one visible (#977)"
```

- [ ] **Step 8: PR**

```bash
gh pr create --fill --base master --body "Closes #977" && gh pr merge --merge --auto
```

---

## Task Group 3 — Drawer closes on nav + page transition (#978)

**Branch:** `fix/978-drawer-close-on-nav`

**Files:**

- Modify: `app/components/ui/UiAppShell/UiAppShell.vue`
- Test: `app/components/ui/UiAppShell/__tests__/UiAppShell.spec.ts`
- Modify: `app/app.vue` or `nuxt.config.ts` (pageTransition)

- [ ] **Step 1: Write the failing test**

In `UiAppShell.spec.ts`, mock `vue-router`'s `useRoute` with a reactive `path`, render the shell on mobile with the drawer open, change `route.path`, and assert `closeDrawer` ran (drawer no longer has `--drawer-open`). Use the existing test's mobile setup as the template.

```ts
it("closes the mobile drawer when the route changes", async () => {
  // open drawer, then:
  routePath.value = "/transactions";
  await nextTick();
  expect(wrapper.find(".ui-app-shell__sidebar--drawer-open").exists()).toBe(false);
});
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `pnpm test -- UiAppShell`

- [ ] **Step 3: Add the route watch**

In `UiAppShell.vue` `<script setup>`, after the `useResponsiveShell()` destructure:

```ts
watch(
  () => route.path,
  () => {
    closeDrawer();
  },
);
```

- [ ] **Step 4: Run it — expect PASS**

Run: `pnpm test -- UiAppShell`

- [ ] **Step 5: Add a page transition**

In `nuxt.config.ts` set `app: { pageTransition: { name: "page", mode: "out-in" } }` (merge with existing `app` config). Add the `.page-enter-active/.page-leave-active` fade-slide CSS to the global stylesheet (`app/assets/...` — locate the global css imported by `nuxt.config`). Keep it short (150–200ms) and respect `prefers-reduced-motion`.

- [ ] **Step 6: Gate + commit + PR**

```bash
pnpm quality-check
git add app/components/ui/UiAppShell/UiAppShell.vue app/components/ui/UiAppShell/__tests__/UiAppShell.spec.ts nuxt.config.ts app/assets
git commit -m "fix(shell): close mobile drawer on navigation + page transition (#978)"
gh pr create --fill --base master --body "Closes #978" && gh pr merge --merge --auto
```

**AC verification:** On a 375px viewport, open drawer → tap a nav item → page transitions and drawer closes.

---

## Task Group 4 — Wallet audit (#979)

**Branch:** `fix/979-wallet-audit`

**Files:**

- Inspect/modify: `app/pages/portfolio.vue`, `app/components/wallet/*`
- Tests: alongside any component changed.

This is audit-then-fix; the first steps are real investigation, not placeholders.

- [ ] **Step 1: Inventory displayed values**

Run and review:

```bash
cd app && grep -nE '>\s*R\$|[0-9]+,[0-9]{2}|[0-9]+\.[0-9]+%|toFixed\(' pages/portfolio.vue
```

For each hit, classify: bound to a query/composable/computed (OK) vs literal/mock (NOT OK). Record `file:line` + literal for each NOT-OK.

- [ ] **Step 2: Inventory interactive elements**

```bash
cd app && grep -nE '<NButton|<UiButton|<button|<NuxtLink|@click' pages/portfolio.vue
```

For each: confirm it has a real `@click`/`to`. Flag any button with no handler, empty handler, or `TODO`. Record `file:line`.

- [ ] **Step 3: Confirm data sources are live**

Verify `pages/portfolio.vue` consumes real queries (`features/wallet/queries/*`, BRAPI quote queries). Note any value that should come from a query but is currently static.

- [ ] **Step 4: Write the findings report**

Create `docs/superpowers/reports/2026-06-02-wallet-audit.md` listing each finding (file:line, before, decision: wire / replace with empty state / remove).

- [ ] **Step 5: Fix — replace hardcoded with real data or honest empty state**

For each hardcoded value: bind to the real source, or render `UiEmptyState`/loading when data is absent (no placeholder numbers in nominal flow — `auraxis-web/CLAUDE.md` rule). Add/extend a unit test asserting the value reflects the query, not a constant.

- [ ] **Step 6: Fix — wire or remove dead CTAs**

For each dead control: give it the correct action (route/handler) or remove it. Add a test asserting the handler fires / route is correct.

- [ ] **Step 7: Gate + commit + PR**

```bash
pnpm quality-check
git add app/pages/portfolio.vue app/components/wallet docs/superpowers/reports/2026-06-02-wallet-audit.md
git commit -m "fix(wallet): remove hardcoded values and wire dead CTAs on Carteira (#979)"
gh pr create --fill --base master --body "Closes #979" && gh pr merge --merge --auto
```

---

## Task Group 5 — Transactions: today insight + past accordion (#980)

**Branch:** `feat/980-transactions-insight-history`

**Files:**

- Modify: `app/pages/transactions/index.vue`
- Possibly new: `app/features/ai-insights/components/InsightHistoryAccordion.vue` (+ spec)
- Reuse: `useAIInsightsHistory(page, perPage)` → `AIInsightHistoryDTO`; `AiInsightAccordionItem.vue`; `AiInsightSurface.vue`.

- [ ] **Step 1: Read the insight contracts**

Read `app/features/ai-insights/contracts/ai-insight.ts` (find `AIInsightHistoryDTO` and the per-insight fields, esp. the created/generated date) and `AiInsightSurface.vue` / `AiInsightAccordionItem.vue` to see how a single insight renders. Identify the date field (e.g. `created_at` / `generated_at`).

- [ ] **Step 2: Write the failing model test — "is today" + split**

Create `app/features/ai-insights/model/insight-history.spec.ts`:

```ts
import { splitTodayAndPast } from "./insight-history";

it("separates today's insight from past ones", () => {
  const today = "2026-06-02";
  const items = [
    { id: "a", created_at: "2026-06-02T10:00:00Z" },
    { id: "b", created_at: "2026-05-30T09:00:00Z" },
  ] as any[];
  const { todayInsight, past } = splitTodayAndPast(items, today);
  expect(todayInsight?.id).toBe("a");
  expect(past.map((i) => i.id)).toEqual(["b"]);
});

it("returns null today when none generated today", () => {
  const { todayInsight, past } = splitTodayAndPast(
    [{ id: "b", created_at: "2026-05-30T09:00:00Z" }] as any[],
    "2026-06-02",
  );
  expect(todayInsight).toBeNull();
  expect(past).toHaveLength(1);
});
```

- [ ] **Step 3: Run it — expect FAIL**

Run: `pnpm test -- insight-history`

- [ ] **Step 4: Implement `splitTodayAndPast`**

Create `app/features/ai-insights/model/insight-history.ts`:

```ts
import type { AIInsightDTO } from "~/features/ai-insights/contracts/ai-insight";

export interface SplitInsights {
  todayInsight: AIInsightDTO | null;
  past: AIInsightDTO[];
}

/** Splits history into today's insight (if any) and the rest (newest first). */
export function splitTodayAndPast(items: AIInsightDTO[], todayIso: string): SplitInsights {
  const isToday = (i: AIInsightDTO): boolean => (i.created_at ?? "").slice(0, 10) === todayIso;
  const todayInsight = items.find(isToday) ?? null;
  const past = items.filter((i) => i !== todayInsight);
  return { todayInsight, past };
}
```

(Use the real field name discovered in Step 1.)

- [ ] **Step 5: Run it — expect PASS**

Run: `pnpm test -- insight-history`

- [ ] **Step 6: Compose on the Transactions page**

In `pages/transactions/index.vue`, fetch `useAIInsightsHistory()`, derive `splitTodayAndPast(data.items, todayIso)`. Render:

- If `todayInsight` → today's insight on top (existing single-insight component), then an accordion (`AiInsightAccordionItem` per `past`) below.
- Else → alt copy (`$t("insights.history.noTodayYet")` ≈ "Você ainda não gerou um insight hoje — veja seus insights anteriores:") + the past accordion.
  Add the i18n keys to `pt.json` (do NOT touch frozen `en.json` without the DEC-186 bypass).

- [ ] **Step 7: Component test**

Add/extend `pages` or a focused component spec: with a today-insight present, assert it renders above the accordion; absent, assert the alt copy + accordion render. Mock `useAIInsightsHistory`.

- [ ] **Step 8: Gate + commit + PR**

```bash
pnpm quality-check
git add app/features/ai-insights app/pages/transactions/index.vue app/i18n/locales/pt.json
git commit -m "feat(insights): show today's insight + past-insights accordion on Transactions (#980)"
gh pr create --fill --base master --body "Closes #980" && gh pr merge --merge --auto
```

---

## Task Group 6 — Two-tier responsive header (#981)

**Branch:** `feat/981-two-tier-header`

**Files:**

- Modify: `app/components/ui/UiTopbar/UiTopbar.vue`
- Modify: `app/components/ui/UiPageHeader/UiPageHeader.vue` (responsive title size)
- Test: `app/components/ui/UiTopbar/__tests__/` (+ update `UiTopbar.stories.ts`)

- [ ] **Step 1: Write the failing layout test**

Assert that at mobile width the topbar exposes a second row container for extras. Add a spec rendering `UiTopbar` with the `extras` slot and a `data-testid="topbar-extras-row"` wrapper present when `showMenuButton` (mobile) is true:

```ts
it("renders a dedicated extras row on mobile", () => {
  const wrapper = mount(UiTopbar, {
    props: { title: "Dashboard", showMenuButton: true },
    slots: { extras: "<span>Premium</span>" },
  });
  expect(wrapper.find('[data-testid="topbar-extras-row"]').exists()).toBe(true);
});
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `pnpm test -- UiTopbar`

- [ ] **Step 3: Restructure the template**

In `UiTopbar.vue`, wrap the `extras` slot in a `<div class="ui-topbar__extras-row" data-testid="topbar-extras-row">`. With CSS:

- Desktop (`min-width: 768px`): keep current single row — extras row sits inline on the right (`display: contents` or flex within `__right`).
- Mobile (`max-width: 767.98px`): `.ui-topbar` becomes `flex-direction: column; align-items: stretch;`; row 1 = `__left` + (theme + avatar); row 2 = `.ui-topbar__extras-row` (full-width, Premium badge left-aligned). Reduce title size in `UiPageHeader` under 768px.

- [ ] **Step 4: Run it — expect PASS** (`pnpm test -- UiTopbar`)

- [ ] **Step 5: Update the story** to show the mobile two-tier variant.

- [ ] **Step 6: Gate + commit + PR**

```bash
pnpm quality-check
git add app/components/ui/UiTopbar app/components/ui/UiPageHeader
git commit -m "feat(ui): two-tier responsive header on mobile (#981)"
gh pr create --fill --base master --body "Closes #981" && gh pr merge --merge --auto
```

**AC verification:** 360–767px → title row + separate Premium row, nothing clipped; ≥768px unchanged.

---

## Task Group 7 — Financial calendar widget on dashboard (#983)

> Build #983 before #982 so the revamp can slot a finished widget. (#982 depends on this.)

**Branch:** `feat/983-dashboard-calendar`

**Files:**

- Create: `app/features/dashboard/components/DashboardCalendarPanel.vue` (+ `__tests__`)
- Reuse: `FinancialCalendar` (props `initialYear?`, `initialMonth?`; emits `day-click(CalendarDay)`), `CalendarDayDetail`, `useFinancialCalendar`.

- [ ] **Step 1: Read the consumers**

Read how `pages/transactions/index.vue` already wires `FinancialCalendar` + `CalendarDayDetail` (the `@day-click` → open modal pattern) and any premium gate it applies. Mirror that pattern.

- [ ] **Step 2: Write the failing component test**

`app/features/dashboard/components/__tests__/DashboardCalendarPanel.spec.ts`:

```ts
it("opens the day-detail modal when a day is clicked", async () => {
  const wrapper = mount(DashboardCalendarPanel, { global: { stubs: { teleport: true } } });
  await wrapper.findComponent(FinancialCalendar).vm.$emit("day-click", fakeDay);
  expect(wrapper.findComponent(CalendarDayDetail).props("open")).toBe(true);
});
```

(Use the real `CalendarDayDetail` prop/visibility API discovered in Step 1.)

- [ ] **Step 3: Run it — expect FAIL** (`pnpm test -- DashboardCalendarPanel`)

- [ ] **Step 4: Implement the panel**

```vue
<script setup lang="ts">
import { ref } from "vue";
import FinancialCalendar from "~/components/financial-calendar/FinancialCalendar/FinancialCalendar.vue";
import CalendarDayDetail from "~/components/financial-calendar/CalendarDayDetail/CalendarDayDetail.vue";
import type { CalendarDay } from "~/features/transactions/composables/useFinancialCalendar";

const selectedDay = ref<CalendarDay | null>(null);
const isOpen = ref(false);
function onDayClick(day: CalendarDay): void {
  selectedDay.value = day;
  isOpen.value = true;
}
</script>
<template>
  <UiSurfaceCard class="dashboard-calendar-panel" padding="none">
    <FinancialCalendar @day-click="onDayClick" />
    <CalendarDayDetail :open="isOpen" :day="selectedDay" @close="isOpen = false" />
  </UiSurfaceCard>
</template>
```

(Align prop names with the real `CalendarDayDetail` API.)

- [ ] **Step 5: Run it — expect PASS** (`pnpm test -- DashboardCalendarPanel`)

- [ ] **Step 6: Apply premium gating** matching the Transactions page (entitlement check → paywall surface if gated). Add a test for the gated branch.

- [ ] **Step 7: Gate + commit + PR**

```bash
pnpm quality-check
git add app/features/dashboard/components/DashboardCalendarPanel.vue app/features/dashboard/components/__tests__/DashboardCalendarPanel.spec.ts
git commit -m "feat(dashboard): financial calendar panel with day-detail modal (#983)"
gh pr create --fill --base master --body "Closes #983" && gh pr merge --merge --auto
```

---

## Task Group 8 — Dashboard revamp: calendar hero + comparatives (#982)

> Depends on #983 (DashboardCalendarPanel).

**Branch:** `feat/982-dashboard-revamp`

**Files:**

- Modify: `app/features/dashboard/components/DashboardMarketPulseWorkspace.vue`
- Modify: `app/pages/dashboard.vue` (composition order)
- Tests: `app/features/dashboard/components/__tests__/DashboardMarketPulseWorkspace.spec.ts`
- Possibly reuse: `DashboardPeriodComparisonStrip.vue` (already exists).

- [ ] **Step 1: Write the failing test — low-value panels removed**

In `DashboardMarketPulseWorkspace.spec.ts`:

```ts
it("no longer renders the Transações Recentes or Anomalias panels", () => {
  const wrapper = mount(DashboardMarketPulseWorkspace, { props: baseProps });
  expect(wrapper.text()).not.toContain("Transações Recentes");
  expect(wrapper.text()).not.toContain("Anomalias Detectadas");
});
```

- [ ] **Step 2: Run it — expect FAIL** (`pnpm test -- DashboardMarketPulseWorkspace`)

- [ ] **Step 3: Remove the low-value panels**

In `DashboardMarketPulseWorkspace.vue`, delete the `market-pulse__bottom` section (the "Transações Recentes" table with its dead `NInput`/Filter `NButton` and the "Anomalias Detectadas" card) and the now-unused `buildTransactionRows`, `buildAnomalies`, `transactionRows`, `anomalies`, related interfaces, and dead imports (`Search`, `Filter`, `BadgeAlert`, etc.). Keep `executiveSignals` (it still summarises alerts) or fold alert info into the comparatives strip.

- [ ] **Step 4: Run it — expect PASS** (`pnpm test -- DashboardMarketPulseWorkspace`)

- [ ] **Step 5: Add the comparatives strip**

Render `DashboardPeriodComparisonStrip` (reuse) using the real `comparison` prop, placed under the KPIs. Add a test asserting it renders the month-over-month deltas from `comparison`.

- [ ] **Step 6: Compose the calendar hero**

In `pages/dashboard.vue`, add `<DashboardCalendarPanel class="dashboard-page__calendar" />` as the prominent lower section (after the workspace, before/with the AI surfaces). Confirm it sits in the empty-state-aware `v-else` branch so it only shows with data.

- [ ] **Step 7: Run full dashboard tests** (`pnpm test -- dashboard`) and fix fallout from removed symbols.

- [ ] **Step 8: Gate + commit + PR**

```bash
pnpm quality-check
git add app/features/dashboard app/pages/dashboard.vue
git commit -m "feat(dashboard): calendar-hero revamp; drop low-value panels (#982)"
gh pr create --fill --base master --body "Closes #982" && gh pr merge --merge --auto
```

**AC verification:** Dashboard shows KPIs + comparatives + cashflow + categories + prominent calendar; no empty/low-value panels; only real data.

---

## Self-Review

- **Spec coverage:** #976→TG1, #977→TG2, #978→TG3, #979→TG4, #980→TG5, #981→TG6, #983→TG7, #982→TG8. All 8 covered. Epic #984 is the tracker.
- **Dependencies honored:** TG1 first (de-noise); TG7 (#983) before TG8 (#982).
- **Investigation steps** in TG4/TG5/TG7 are real (grep commands, files to read) because the exact fixes/field-names depend on current code — not placeholders.
- **i18n:** TG5/TG6 add only `pt.json` keys; `en.json` is frozen (DEC-186) — do not edit without the documented bypass.
- **Known traps:** delete macOS `* 2.*` dup files before building (TG1); never `git add .`.
