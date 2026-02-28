# PLT2-PLT5 - Foundation (Web)

## Objetivo

Preparar o frontend web para:

- deploy mínimo contínuo;
- versionamento automático;
- baseline PWA para distribuição;
- integração futura com feature flags OSS.

## Entregas deste bloco

1. `release-please` configurado:
   - `.github/workflows/release-please.yml`
   - `.release-please-config.json`
   - `.release-please-manifest.json`
2. Deploy mínimo via GitHub Pages:
   - `.github/workflows/deploy-minimum.yml`
3. Baseline PWA:
   - `public/manifest.webmanifest`
4. Artefatos manuais para empacotamento em stores:
   - `.github/workflows/pwa-store-artifacts.yml`

## Como operar

### Release automático

- Cada merge em `main/master` executa `Release Please`.
- A action abre/atualiza PR de release.
- Ao mergear o PR de release, tag + release são publicados automaticamente.

### Deploy mínimo (baseline)

- Trigger:
  - push em `main/master`;
  - `workflow_dispatch`.
- Pipeline:
  - `pnpm generate`;
  - upload de `.output/public` como artifact;
  - deploy no ambiente `github-pages`.

### Artefatos de store (manual)

- Trigger:
  - `workflow_dispatch` no workflow `PWA Store Artifacts (Manual)`.
- Pipeline:
  - gera saída estática (`pnpm generate`);
  - empacota `pwa-static-output.tar.gz`;
  - publica artifact `pwa-store-artifacts` para uso em TWA/wrapper nativo.

## Pendências para PLT2 (stores)

- Android (Play Store): empacotar a PWA em shell Android (TWA/alternativa).
- iOS (App Store): wrapper iOS com política de review adequada.
- O passo de publicação em store depende de credenciais e cadastro de apps (manual).

## PLT4.2 (runtime OSS) — entregue

- Runtime de flags com provider `unleash` + fallback local:
  - `app/shared/feature-flags/service.ts`
- Integração real no catálogo de ferramentas:
  - `app/composables/useTools.ts`
- Cache curto para snapshot remoto com fallback resiliente.

Variáveis de ambiente suportadas (Web):

- `NUXT_PUBLIC_FLAG_PROVIDER` (`local` | `unleash`, default `local`)
- `NUXT_PUBLIC_UNLEASH_PROXY_URL` (endpoint base do provider)
- `NUXT_PUBLIC_UNLEASH_CLIENT_KEY` (token de cliente, opcional)
- `NUXT_PUBLIC_UNLEASH_APP_NAME` (default `auraxis-web`)
- `NUXT_PUBLIC_UNLEASH_INSTANCE_ID` (default `auraxis-web`)
- `NUXT_PUBLIC_UNLEASH_ENVIRONMENT` (default `development`)
- `NUXT_PUBLIC_UNLEASH_CACHE_TTL_MS` (default `30000`)

## PLT4.1 (higiene de flags) — entregue

- Catálogo versionado de flags:
  - `config/feature-flags.json`
- Validador de metadados:
  - `scripts/check-feature-flags.cjs`
- Gate no CI:
  - job `Feature Flags Hygiene` em `.github/workflows/ci.yml`
- Paridade local:
  - etapa `flags:hygiene` em `scripts/run_ci_like_actions_local.sh`
