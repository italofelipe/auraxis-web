# Feature flags

Guia operacional do módulo `app/shared/feature-flags/`.
Alinhado com o gate canônico `isFeatureEnabled(flagKey, providerDecision?)`.

## Cadeia de resolução

A decisão de uma flag passa por três camadas, na seguinte ordem de prioridade:

1. **Provider externo** (Unleash ou PostHog) — quando configurado e respondendo.
2. **Override de ambiente** — `NUXT_PUBLIC_FLAG_<KEY_UPPER_SNAKE>` (ex.:
   `NUXT_PUBLIC_FLAG_WEB_PREMIUM_PAYWALL_ENABLED=true`).
3. **Catálogo local versionado** — `config/feature-flags.json`, resolvido contra
   o ambiente ativo (`enabled-dev` / `enabled-staging` / `enabled-prod`).

Se nenhuma das três camadas habilitar a flag, o fallback é `false` — o código
chamador continua funcionando mesmo com o provider fora do ar.

## Selecionando o provider

Variável: `NUXT_PUBLIC_FLAG_PROVIDER` (ou `AURAXIS_FLAG_PROVIDER` como alias
canônico cross-stack).

| Valor     | Comportamento                                                                        |
| --------- | ------------------------------------------------------------------------------------ |
| `local`   | Default. Somente catálogo + env overrides. Não faz I/O remoto.                       |
| `unleash` | Lê snapshot de `NUXT_PUBLIC_UNLEASH_PROXY_URL/api/client/features` (cache 30s).      |
| `posthog` | Lê `posthog.isFeatureEnabled(key)` via SDK já inicializado pelo plugin de analytics. |

## Modo PostHog

Reaproveita a instância `posthog-js` inicializada por `app/plugins/posthog.client.ts`:

- Sem `NUXT_PUBLIC_POSTHOG_API_KEY`, o plugin fica inerte e
  `resolvePostHogDecision` retorna `undefined` — a cadeia segue para env override
  e catálogo local.
- Em dev, setar a chave + `NUXT_PUBLIC_FLAG_PROVIDER=posthog` permite testar
  experimentos reais com as cohorts configuradas no painel do PostHog.
- SSR seguro: o import de `posthog-js` é dinâmico e silencia falhas de
  resolução (try/catch), então usar esse provider não quebra rotas SSG.

## Uso em componentes

### Síncrono (recomendado para SSG e gates de feature simples)

```vue
<script setup lang="ts">
import { useFeatureFlag } from "~/shared/feature-flags";

const paywallEnabled = useFeatureFlag("web.premium.paywall-enabled");
</script>

<template>
  <PaywallBanner v-if="paywallEnabled" />
</template>
```

- Resolve contra **env override → catálogo local** apenas (sem I/O).
- Zero risco de mismatch de hidratação.

### Assíncrono (consulta provider remoto)

```vue
<script setup lang="ts">
import { useFeatureFlagAsync } from "~/shared/feature-flags";

const { enabled, isResolving } = useFeatureFlagAsync("web.dashboard.new-layout");
</script>

<template>
  <DashboardNew v-if="enabled" />
  <DashboardLegacy v-else />
</template>
```

- Render inicial usa o valor local — sem mismatch SSR.
- Após `onMounted`, o provider responde e o componente reage.
- `isResolving` expõe o estado intermediário caso a UI queira skeleton.

## Adicionando uma flag

1. Adicionar entrada em `config/feature-flags.json` com `key`, `owner`,
   `createdAt`, `removeBy`, `type` (`release` | `experiment` | `ops-toggle`),
   `status` e descrição curta.
2. Usar `useFeatureFlag` no(s) ponto(s) de consumo.
3. Se for experimento dinâmico: cadastrar a mesma key no painel do PostHog
   (ou Unleash) com a cohort/rollout desejado.
4. Cobrir o gate com teste unitário mockando `isFeatureEnabled`.

## Removendo uma flag

Quando o experimento terminar:

1. Remover a entrada do catálogo.
2. Remover `useFeatureFlag` dos call sites.
3. Remover a cohort no provider remoto para evitar drift.

## Referências

- Serviço: `app/shared/feature-flags/service.ts`
- Composable: `app/shared/feature-flags/use-feature-flag.ts`
- Catálogo: `config/feature-flags.json`
- Plugin PostHog: `app/plugins/posthog.client.ts`
