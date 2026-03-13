# quality_gates.md — auraxis-web

## Gates obrigatórios antes de commit

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm policy:check
pnpm contracts:check
pnpm build
```

## Regras

- falha em qualquer gate = não commitar
- bloqueio externo deve ser registrado na issue correspondente do GitHub Projects
- não usar `tasks.md`
- placeholders não podem mascarar erro real do fluxo nominal
