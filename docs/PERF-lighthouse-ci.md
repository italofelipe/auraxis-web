# Lighthouse CI — Setup e Baseline de Métricas

## Como funciona

O job `lighthouse` em `.github/workflows/ci.yml` executa após o `build` job em todo PR e push para `main`.

Fluxo:

1. `pnpm build` — build de produção (Nuxt generate/SSR)
2. `lhci autorun` (via `treosh/lighthouse-ci-action@v12`) — lê `.lighthouserc.yml`
3. `.lighthouserc.yml` inicia `pnpm preview` como servidor e roda 3 coletas contra `http://localhost:3000/`
4. Resultados são enviados para `temporary-public-storage` (13 dias de retenção)
5. O link para o relatório aparece no log do job

> O Lighthouse roda contra o **build real** (`pnpm build` + `pnpm preview`), não contra o dev server.
> Isso garante que otimizações de produção (tree-shaking, minificação, etc.) sejam consideradas.

## Thresholds atuais

| Métrica           | Nível                   | Threshold |
| ----------------- | ----------------------- | --------- |
| Accessibility     | **error** (bloqueia CI) | ≥ 0.90    |
| SEO               | warn                    | ≥ 0.85    |
| Performance score | warn                    | ≥ 0.50    |
| LCP               | warn                    | ≤ 5000ms  |
| TBT               | warn                    | ≤ 1500ms  |
| CLS               | warn                    | ≤ 0.25    |

**Nota:** Performance metrics são `warn` (não bloqueiam CI). Os valores são generosos propositalmente — o objetivo é capturar o baseline antes de apertar. Após a Fase 2 de hardening (PERF-GAP-01/02/06/07), apertar para:

- Performance ≥ 0.80
- LCP ≤ 2500ms
- TBT ≤ 600ms
- CLS ≤ 0.10

## Como interpretar os resultados

O link para o relatório aparece no output do step "Run Lighthouse CI". Exemplo:

```
✅ https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/...
```

Métricas com `⚠ warn` aparecem no log mas **não bloqueiam o merge**.
Métricas com `✖ error` bloqueiam o merge.

## Rodar localmente

```bash
# Build primeiro
pnpm build

# Rodar lhci localmente (abre relatório no browser)
pnpm dlx @lhci/cli autorun
```

## Desabilitar temporariamente um threshold

Caso uma métrica esteja failing por razão conhecida, mover de `error` para `warn` em `.lighthouserc.yml` enquanto o fix não vai para prod.

## Referência

- Issue: [PERF-GAP-08](https://github.com/italofelipe/auraxis-web/issues/613)
- Próximas etapas: PERF-GAP-06 (#611), PERF-GAP-07 (#612), HARD-10 (#597)
- Config: `.lighthouserc.yml`
- Job: `.github/workflows/ci.yml` → job `lighthouse` (linha ~362)
