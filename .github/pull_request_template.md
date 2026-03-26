## Summary

<!-- What changed and why -->

## Task Reference

- Task ID: `WEBx` / `PLTx` / `DSH-x` / `Bxx` (if integration)
- GitHub Projects / issue updated: [ ] yes

## Validation

- [ ] `pnpm quality-check`
- [ ] `pnpm contracts:check`
- [ ] `pnpm build`

## Frontend Governance (Mandatory)

- [ ] No `.js/.jsx` introduced in product code.
- [ ] Shared/reusable code moved to `app/shared/*` or `app/core/*` when appropriate.
- [ ] Feature-based organization respected.
- [ ] No placeholder masks nominal integration failures.

## Deploy checklist _(preencher apenas se `.github/workflows/deploy*.yml` ou `nuxt.config.ts` foram alterados)_

- [ ] `S3_BUCKET` bate com o origin da distribuição CloudFront? (run `aws cloudfront get-distribution --id <ID> --query '...Origins.Items[0].DomainName'`)
- [ ] `AWS_WEB_CLOUDFRONT_DISTRIBUTION_ID` (secret/var) aponta para a distribuição correta?
- [ ] Smoke test cobre o novo comportamento?
- [ ] Consultar `.context/09_infra_map.md` no `auraxis-platform` antes de alterar qualquer valor de infra.

## Risks / Follow-ups

<!-- Residual risk, technical debt, and next action -->
