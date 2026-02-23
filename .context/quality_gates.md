# quality_gates.md — auraxis-web

## Gates locais (obrigatórios antes de todo commit)

Execute nesta ordem:

```bash
# 1. Lint (@nuxt/eslint)
pnpm lint

# 2. Type-check
pnpm typecheck

# 3. Testes unitários
pnpm test

# 4. Build de verificação (opcional mas recomendado antes de PR)
pnpm build
```

**Atalho — rodar tudo de uma vez:**

```bash
pnpm quality-check
```

## Thresholds

| Gate                  | Threshold                    | O que falha                                              |
| :-------------------- | :--------------------------- | :------------------------------------------------------- |
| ESLint (@nuxt/eslint) | 0 erros                      | Código com violações de estilo ou bugs estáticos         |
| TypeScript            | 0 erros                      | `any` implícito, tipos incompatíveis, imports errados    |
| Vitest                | 100% passing, ≥ 85% coverage | Qualquer teste quebrando ou coverage abaixo do threshold |
| Build                 | Sucesso                      | Import circular, erro de SSR, módulo ausente             |

## Gates de CI (automáticos no GitHub Actions)

Ao abrir PR, o CI roda automaticamente:

- ESLint via `pnpm lint` (falha se houver erro)
- TypeScript check via `pnpm typecheck`
- Vitest com coverage report via `pnpm test:coverage`
- Build de verificação via `pnpm build`

> Se CI falha mas local passa: provavelmente diferença de versão de node ou variável de ambiente. Checar `.nvmrc` ou `engines` em `package.json`.

## Guardrails de segurança

Antes de commitar, verificar manualmente:

- Nenhuma chave de API, token ou secret hardcoded
- Nenhum `console.log` com dados de usuário em produção
- Variáveis de ambiente de servidor em `NUXT_` (não `NUXT_PUBLIC_`)
- `localStorage` não sendo usado para dados sensíveis

## Não é parte do gate de commit

- Deploy (feito via CI/CD após merge)
- Review de acessibilidade (feito em PR review)
- Performance audit (feito periodicamente)
