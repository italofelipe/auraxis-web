## Summary

<!-- What changed and why -->

## Task Reference

- Task ID: `WEBx` / `PLTx` / `Bxx` (if integration)
- Backlog updated in `/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-web/tasks.md`: [ ] yes

## Validation

- [ ] `pnpm quality-check`
- [ ] `pnpm contracts:check`
- [ ] `pnpm build`

## Frontend Governance (Mandatory)

- [ ] No `.js/.jsx` introduced in product code.
- [ ] All styling uses tokens/theme (no arbitrary literals).
- [ ] Reusable code moved to `app/shared/*`.
- [ ] Chakra-first approach respected (wrappers/components before raw HTML primitives).

## Contract Integration (Mandatory when backend contract changed)

- [ ] Read `Feature Contract Pack` (`.context/feature_contracts/<TASK_ID>.md`).
- [ ] Updated `contracts/feature-contract-baseline.json` (if new/changed pack).
- [ ] Regenerated OpenAPI types (`pnpm contracts:sync`) and reviewed diff.

## Risks / Follow-ups

<!-- Residual risk, technical debt, and next action -->
