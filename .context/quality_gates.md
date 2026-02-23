# quality_gates.md — auraxis-web

> Gates de qualidade obrigatórios para o projeto web do Auraxis.
> Atualizado: 2026-02-23 — stack completa (Vitest + Playwright + Lighthouse + SonarCloud)

---

## 1. Gates locais — obrigatórios antes de todo commit

Execute nesta ordem:

```bash
# 1. Lint (@nuxt/eslint)
pnpm lint

# 2. Type-check (nuxt typecheck)
pnpm typecheck

# 3. Testes + coverage
pnpm test:coverage

# Atalho — tudo de uma vez (obrigatório antes de commitar):
pnpm quality-check
```

> Se qualquer gate falhar: **não commitar**. Corrigir o problema primeiro.
> Se for bloqueio de dependência externa, registrar em `tasks.md`.

---

## 2. Thresholds locais (vitest.config.ts)

| Gate                     | Threshold | Arquivo de config                             |
| :----------------------- | :-------- | :-------------------------------------------- |
| ESLint                   | 0 erros   | `eslint.config.mjs` (gerado por @nuxt/eslint) |
| TypeScript               | 0 erros   | `tsconfig.json` (strict: true)                |
| Vitest — testes passando | 100%      | `vitest.config.ts`                            |
| Vitest — lines           | ≥ 85%     | `vitest.config.ts#coverage.thresholds`        |
| Vitest — functions       | ≥ 85%     | `vitest.config.ts#coverage.thresholds`        |
| Vitest — statements      | ≥ 85%     | `vitest.config.ts#coverage.thresholds`        |
| Vitest — branches        | ≥ 80%     | `vitest.config.ts#coverage.thresholds`        |
| Build Nuxt               | Sucesso   | `nuxt.config.ts`                              |

---

## 3. Gates de CI — automáticos no GitHub Actions

O CI roda automaticamente em todo push e PR para master.

### Jobs e thresholds

| Job                      | O que verifica          | Threshold            | Bloqueia merge?    |
| :----------------------- | :---------------------- | :------------------- | :----------------- |
| `lint`                   | @nuxt/eslint            | 0 erros              | ✅ sim             |
| `typecheck`              | TypeScript strict       | 0 erros              | ✅ sim             |
| `test`                   | Vitest + coverage       | ≥ 85% lines          | ✅ sim             |
| `build`                  | nuxt build              | sucesso              | ✅ sim             |
| `bundle-analysis`        | Tamanho do bundle       | ≤ 3 MB hard (public) | ✅ sim (PR apenas) |
| `secret-scan-gitleaks`   | Secrets no código       | 0 detectados         | ✅ sim             |
| `secret-scan-trufflehog` | Secrets com entropia    | 0 verificados        | ✅ sim             |
| `audit`                  | CVEs em deps instaladas | 0 high/critical      | ✅ sim             |
| `sonarcloud`             | Análise estática        | quality gate pass    | ✅ sim             |
| `lighthouse`             | Perf / A11y / SEO / CWV | ver abaixo           | ✅ sim             |
| `e2e`                    | Playwright              | 0 falhas             | ✅ sim             |
| `commitlint`             | Conventional Commits    | válido               | ✅ sim (PR apenas) |
| `dependency-review`      | CVEs em novas deps      | 0 high/critical      | ✅ sim (PR apenas) |

### Lighthouse CI — thresholds detalhados

| Métrica                        | Threshold  | Tipo                         |
| :----------------------------- | :--------- | :--------------------------- |
| Performance score              | ≥ 80       | Aviso se 80-89, erro se < 80 |
| Accessibility score            | ≥ 90       | Erro se < 90 (obrigatório)   |
| Best Practices score           | ≥ 85       | Aviso se < 85                |
| SEO score                      | ≥ 90       | Aviso se < 90                |
| LCP (Largest Contentful Paint) | ≤ 4.000 ms | Core Web Vital — erro        |
| CLS (Cumulative Layout Shift)  | ≤ 0.1      | Core Web Vital — erro        |
| TBT (Total Blocking Time)      | ≤ 600 ms   | Aviso                        |
| FCP (First Contentful Paint)   | ≤ 2.000 ms | Aviso                        |

### Bundle size — thresholds

| Asset                  | Aviso    | Hard limit (falha CI) |
| :--------------------- | :------- | :-------------------- |
| Public (client JS/CSS) | > 1.5 MB | > 3 MB                |
| Server bundle          | > 5 MB   | —                     |

---

## 4. Guardrails de segurança — verificação manual antes de commitar

```bash
# Verificar se há secrets hardcoded (roda automaticamente no pre-commit via Gitleaks)
git diff --cached | grep -iE "(api_key|secret|password|token|Bearer)" || echo "ok"

# Verificar variáveis de ambiente
# NUXT_*        → servidor ✅
# NUXT_PUBLIC_* → cliente (nunca segredos) ✅
# Qualquer outra → risco de exposição ⚠️
```

Checklist manual:

- [ ] Nenhuma chave de API ou token hardcoded no código
- [ ] `console.log` com dados de usuário removido antes de produção
- [ ] Variáveis de ambiente de servidor em `NUXT_` (não `NUXT_PUBLIC_`)
- [ ] Dados sensíveis (JWT) em cookies `httpOnly`, nunca `localStorage`
- [ ] `.env*` em `.gitignore` e não staged

---

## 5. Executando testes localmente

### Testes unitários

```bash
# Rodar todos os testes
pnpm test

# Modo watch (desenvolvimento)
pnpm test:watch

# Com coverage completo
pnpm test:coverage

# Arquivo específico
pnpm test src/composables/useBalance.spec.ts
```

### Testes E2E (Playwright)

```bash
# Requer build do projeto primeiro
pnpm build

# Rodar todos os E2E
pnpm test:e2e

# Modo interativo (debug visual)
pnpm test:e2e:ui

# Debug step-by-step
pnpm test:e2e:debug

# Arquivo específico
pnpm exec playwright test e2e/auth.spec.ts
```

### Lighthouse local

```bash
# Requer servidor rodando
pnpm preview &
pnpm dlx @lhci/cli autorun
```

---

## 6. O que NÃO faz parte do gate de commit

| Item                            | Por quê                           |
| :------------------------------ | :-------------------------------- |
| Deploy                          | Executado via CI/CD após merge    |
| Lighthouse completo             | Executado no CI (requer servidor) |
| E2E Playwright                  | Executado no CI (requer build)    |
| Review de acessibilidade manual | Feito no PR review                |
| Teste em browsers adicionais    | Firefox/Safari rodam no CI        |

---

## 7. Troubleshooting

| Sintoma                                  | Causa provável                       | Solução                                      |
| :--------------------------------------- | :----------------------------------- | :------------------------------------------- |
| `pnpm lint` passa local, falha no CI     | Diferença de Node.js version         | Verificar `.nvmrc` ou `engines`              |
| Coverage cai abaixo do threshold         | Código novo sem teste                | Escrever testes antes do merge               |
| Vitest falha com erro de importação Nuxt | `.nuxt/` desatualizado               | Rodar `pnpm postinstall`                     |
| Playwright falha no CI                   | Server não subiu a tempo             | Aumentar `timeout` em `playwright.config.ts` |
| TruffleHog falsa positiva                | Pattern de string similar a secret   | Adicionar ao `.trufflehog.yml` de allowlist  |
| SonarCloud quality gate falha            | Coverage caiu ou dívida técnica alta | Ver dashboard em sonarcloud.io               |
