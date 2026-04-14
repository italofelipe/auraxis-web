# WEB-tool-page-pattern

Pattern for tool calculator pages in auraxis-web.
Established in REF-GAP-02 (issue #616).

## Rationale

Monolithic SFCs for tool pages grow past 800–1000 LOC quickly. They become hard to test,
hard to review, and impossible to reuse. The feature structure splits a tool into
well-scoped, independently testable units.

## Target structure

```
app/features/tools/<tool-slug>/
  page.vue                          ← shell/layout (<250 LOC for pure local tools)
  useXxxCalculator.ts               ← re-export facade OR pure calculation composable
  xxx.schema.ts                     ← Zod input validation schema
  XxxResult.vue                     ← result display component (props-only, no state)
  __tests__/
    useXxxCalculator.spec.ts        ← unit tests (no Vue, pure functions)

app/pages/tools/<tool-slug>.vue     ← thin route wrapper (SEO + import from feature)
```

## Responsibilities per file

### `page.vue` (shell)

- Owns reactive state: `form`, `result`, `savedSimulationId`, modal flags.
- Orchestrates mutations (save, bridge actions).
- Delegates display to `XxxResult.vue` and shared components.
- Does NOT hold calculation logic.
- Does NOT manage SEO/meta — that belongs in the route wrapper.

### `useXxxCalculator.ts`

- For tools with pure front-end calculation: re-exports `calculateXxx`, `validateXxx`,
  `createDefaultXxxFormState`, types, and constants from `~/features/tools/model/`.
- For tools with API-backed calculation: thin composable wrapping the mutation/query.
- Contains NO Vue reactive state (no `ref`, no `reactive`).
- Fully testable in a pure Node.js environment.

### `xxx.schema.ts`

- Zod schema mirroring the form state interface.
- Provides compile-time and runtime type safety at the form boundary.
- Used in tests and can be used by form libraries if needed.

### `XxxResult.vue`

- Props-in, template-out. No mutations, no async logic.
- Receives the calculation result as a strongly typed prop.
- Scoped CSS only.

### `__tests__/useXxxCalculator.spec.ts`

- Vitest unit tests for all exported pure functions.
- Edge cases: boundary values, zero, negatives, overflow.
- No Vue mounting — pure function imports only.

### Route wrapper (`app/pages/tools/<slug>.vue`)

- Contains `definePageMeta`, `useSeoMeta`, `useHead` for structured data.
- Imports and mounts `XxxPage` from the feature folder.
- No business logic.

## Acceptance criteria checklist

- [ ] `page.vue` < 250 LOC
- [ ] `useXxxCalculator.ts` has no Vue refs
- [ ] `xxx.schema.ts` exports a Zod schema
- [ ] `XxxResult.vue` is props-only
- [ ] `__tests__/useXxxCalculator.spec.ts` covers happy path + edge cases
- [ ] Route page is a thin wrapper
- [ ] `pnpm quality-check` passes

## Pilot tools (REF-GAP-02)

| Tool                | Feature path                              |
| ------------------- | ----------------------------------------- |
| Thirteenth Salary   | `app/features/tools/thirteenth-salary/`   |
| Hora Extra          | `app/features/tools/hora-extra/`          |
| Installment vs Cash | `app/features/tools/installment-vs-cash/` |

## Tools with API-backed calculation

`installment-vs-cash` delegates calculation to the backend API via
`useInstallmentVsCashCalculateMutation`. Its `useInstallmentVsCashCalculator.ts`
re-exports domain helpers and types but does not perform local calculation.

## Naming conventions

| Concept               | Convention                                    |
| --------------------- | --------------------------------------------- |
| Feature folder        | `app/features/tools/<kebab-slug>/`            |
| Calculator composable | `use<PascalSlug>Calculator.ts`                |
| Zod schema            | `<kebab-slug>.schema.ts`                      |
| Result component      | `<PascalSlug>Result.vue`                      |
| Feature page          | `page.vue`                                    |
| Route wrapper         | `app/pages/tools/<kebab-slug>.vue`            |
| Unit test             | `__tests__/use<PascalSlug>Calculator.spec.ts` |
