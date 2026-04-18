# Lighthouse CI — Setup e Baseline de Métricas

## Como funciona

O job `lighthouse` em `.github/workflows/ci.yml` executa após o `build` job em todo PR e push para `main`.

Fluxo:

1. `pnpm build` — build de produção (Nuxt generate/SSR).
2. `lhci autorun` (via `treosh/lighthouse-ci-action@v12`) — lê `.lighthouserc.yml`.
3. `.lighthouserc.yml` inicia `pnpm preview` como servidor e roda **3 coletas** contra `http://localhost:3000/` (média das 3 runs para reduzir variabilidade).
4. Resultados são enviados para `temporary-public-storage` (13 dias de retenção).
5. O link para o relatório aparece no log do job.

> O Lighthouse roda contra o **build real** (`pnpm build` + `pnpm preview`), não contra o dev server.
> Isso garante que otimizações de produção (tree-shaking, minificação, etc.) sejam consideradas.

## Budgets atuais (PERF-8)

Todas as categorias quebram o build (`severity: error`):

| Categoria      | Threshold  | Ação em regressão |
| -------------- | ---------- | ----------------- |
| Performance    | ≥ **0.90** | ❌ Falha CI       |
| Accessibility  | ≥ **0.95** | ❌ Falha CI       |
| Best Practices | ≥ **0.90** | ❌ Falha CI       |
| SEO            | ≥ **0.90** | ❌ Falha CI       |

Métricas granulares (warn-only, não bloqueiam):

| Métrica                  | Threshold |
| ------------------------ | --------- |
| Largest Contentful Paint | ≤ 4000 ms |
| Total Blocking Time      | ≤ 1200 ms |
| Cumulative Layout Shift  | ≤ 0.10    |

## Métricas explicitamente desabilitadas

Os checks abaixo são validados em outras camadas (CloudFront headers, `pnpm audit`, smoke test de deploy) e ficam `severity: off` no Lighthouse porque falham/oscilam contra o preview HTTP local:

- `uses-https`, `redirects-http` — enforcement está no CloudFront/ACM.
- `no-vulnerable-libraries` — coberto por `pnpm audit` + Dependabot.
- `valid-source-maps` — source maps não são emitidos em prod por decisão (ver DEC-093).
- `uses-text-compression`, `uses-long-cache-ttl` — política de cache vive no CloudFront (ver `repos/auraxis-web/docs/CloudFront-headers.md`).
- `bf-cache` — depende de heuristicas do browser e polui o sinal.
- `unused-javascript`, `unused-css-rules` — coberto pelo gate de bundle size (HARD-10) em `scripts/analyze-bundle.cjs`.

## Como interpretar os resultados

- Link do relatório aparece no step **Run Lighthouse CI** (`✅ https://storage.googleapis.com/…`).
- `⚠ warn` aparece no log mas não bloqueia merge.
- `✖ error` bloqueia merge.

## Rodar localmente

```bash
# Build primeiro
pnpm build

# Rodar lhci localmente (mesma config da CI)
pnpm dlx @lhci/cli autorun
```

## Relaxar temporariamente um threshold

Se uma métrica começar a falhar por razão conhecida, mover de `error` para `warn` em `.lighthouserc.yml` **com link para a issue de follow-up** e prazo para voltar a `error`. Relaxamento sem rastreabilidade é proibido — o budget é o contrato.

## Referências

- Issue: [PERF-8](https://github.com/italofelipe/auraxis-web/issues/643) — Lighthouse CI verify contra build real + budget
- Config: `.lighthouserc.yml`
- Workflow: `.github/workflows/ci.yml` → job `lighthouse`
- Gates complementares: bundle size (`HARD-10`), axe-core (`H-A11Y-01`), staleTime (`PERF-GAP-07`).
