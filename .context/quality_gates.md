# quality_gates.md — auraxis-web

## Gates locais (obrigatórios antes de todo commit)

Execute nesta ordem:

```bash
# 1. Lint + formatação (Biome)
npx biome check --write .

# 2. Type-check
npx nuxi typecheck

# 3. Testes unitários
npx vitest run

# 4. Build de verificação (opcional mas recomendado antes de PR)
npx nuxi build
```

**Atalho — rodar tudo de uma vez:**
```bash
npx biome check --write . && npx nuxi typecheck && npx vitest run
```

## Thresholds

| Gate | Threshold | O que falha |
|:-----|:----------|:------------|
| Biome lint | 0 erros | Código com violações de estilo ou bugs estáticos |
| TypeScript | 0 erros | `any` implícito, tipos incompatíveis, imports errados |
| Vitest | 100% passing | Qualquer teste quebrando |
| Build | Sucesso | Import circular, erro de SSR, módulo ausente |

## Gates de CI (automáticos no GitHub Actions)

Ao abrir PR, o CI roda automaticamente:
- Biome check (sem `--write` — falha se houver diff)
- TypeScript check
- Vitest com coverage report
- Build de verificação

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
