# AGENTS.md — auraxis-web

> Lido por Codex, Claude Code e qualquer agente de IA.
> Para Claude Code, o arquivo canônico é `CLAUDE.md`.

## Identidade

Frontend web do Auraxis · Nuxt 4 · Vue 3 · TypeScript strict · Naive UI · TanStack Query

## ⚠️ Trabalho ativo agora

Verificar `.context/active_agents.json` ANTES de começar qualquer trabalho.
Se outro agente estiver em uma issue: deixe-a para ele.

## Passo 1 — Verificar coordenação

```bash
cat /caminho/para/auraxis-platform/.context/active_agents.json
gh issue list --label "agent:in-progress" --state open --repo italofelipe/auraxis-web
```

## Passo 2 — Registrar trabalho

Atualizar `.context/active_agents.json` antes de escrever código.

## Setup

```bash
nvm use 25
pnpm install
# Quality gate:
pnpm quality-check
```

## Convenção de branch

```
feat/claude-<desc>    feat/codex-<desc>
fix/claude-<desc>     fix/codex-<desc>
```

## Regras críticas — NÃO VIOLAR

- ❌ `git add .` ou `git add -A`
- ❌ commit direto em `main`
- ❌ escrever em `.env*` (exceto `.env.example`)
- ❌ usar `useMessage()` diretamente → usar `useToast()` de `app/composables/useToast/`
- ❌ `<img>` direto no template → usar `<UiImage>`

## 🔒 Locale EN — CONGELADO durante MVP1 (DEC-186)

`app/i18n/locales/en.json` está congelado. Para modificar:

1. Incluir `[en-freeze-bypass]` no **subject** do commit
2. Atualizar `app/i18n/locales/.en-frozen.sha256`:
   ```bash
   sha256sum app/i18n/locales/en.json | awk '{print $1}' > app/i18n/locales/.en-frozen.sha256
   ```
   **CI vai bloquear se modificar en.json sem seguir os 2 passos.**

## 🚫 CI — E2E job

O job `e2e` em `ci.yml` faz `pnpm build` localmente.
**NUNCA substituir por `download-artifact@v4`** — causa "Artifact not found" no CI.

## Quality gate

```bash
pnpm quality-check
# Cobre: flags:check → lint → typecheck → test:coverage (≥85%) → policy:check → contracts:check → build
```

## PR rules

- Body deve conter `Closes #<número>`
- Coverage ≥ 85%
- Screenshots para mudanças de UI

## Finalizar trabalho

Ao abrir PR: remover entrada de `.context/active_agents.json`.
