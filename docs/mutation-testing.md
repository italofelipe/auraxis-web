# Mutation Testing

## What and Why

Mutation testing introduces small, deliberate bugs ("mutants") into the source code and verifies
that the existing tests catch them. A high line-coverage score does not guarantee test quality —
mutation testing measures it directly.

We run Stryker against the financial calculators because arithmetic boundary conditions
(tax brackets, interest rounding, CPF/CNPJ digit validation) are the highest-risk logic in the
product and cannot be validated by coverage alone.

## How to Run

```bash
# Quick validation — validators.ts only (~40s)
pnpm mutation:quick

# Full run — all financial models and validators
pnpm mutation
```

Reports are written to `mutation-report/index.html` after each run.

## Thresholds

| Level | Score |
| ----- | ----- |
| High  | ≥ 80% |
| Low   | ≥ 60% |
| Break | ≥ 50% |

A score below `break` causes the command to exit non-zero.

## Mutation Scope

Files targeted for mutation (configured in `stryker.config.mjs`):

- `app/schemas/validators.ts` — CPF, CNPJ, phone, currency validators
- `app/features/tools/model/` — all pure financial calculation models (hora-extra, juros-compostos,
  financiamento-imobiliario, thirteenth-salary, inss-ir-folha, etc.)
