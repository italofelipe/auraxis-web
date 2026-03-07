# G1 — Web Official Deploy

Atualizado: 2026-03-07

## Objetivo

Substituir o canal provisório de GitHub Pages por um canal oficial em AWS,
com deploy controlado, domínio próprio, CloudFront e rollback explícito.

## Workflow canônico

Arquivo:

- `.github/workflows/deploy.yml`

Trigger:

- manual (`workflow_dispatch`)

Inputs:

1. `environment` — `dev`, `pilot`, `prod`
2. `api_base_url` — URL pública da API usada no build estático
3. `run_smoke_test` — executa smoke no hostname oficial
4. `invalidate_cache` — invalida cache do CloudFront

## Secrets obrigatórios

Publicar no repositório `auraxis-web`:

1. `AWS_WEB_DEPLOY_ROLE_ARN`
2. `AWS_WEB_DEPLOY_BUCKET`
3. `AWS_WEB_CLOUDFRONT_DISTRIBUTION_ID`

## Secrets opcionais, mas esperados para G1 completo

1. `NUXT_PUBLIC_SENTRY_DSN`
2. `SENTRY_AUTH_TOKEN`

`NUXT_PUBLIC_SENTRY_DSN` cobre a observabilidade mínima do canal oficial.
`SENTRY_AUTH_TOKEN` só é necessário quando quisermos evoluir para upload de sourcemaps.

## Repository variables recomendadas

1. `WEB_OFFICIAL_HOSTNAME`
   - default esperado: `app.auraxis.com.br`

## Decisão de domínio

1. `app.auraxis.com.br` é o hostname oficial da aplicação web.
2. `auraxis.com.br` fica reservado para site institucional / landing pública.
3. O workflow oficial de deploy do app não deve assumir publish no apex.

## Infra AWS mínima esperada

1. Bucket S3 para artefato web oficial
2. Distribuição CloudFront apontando para o bucket
3. Certificado ACM válido para `app.auraxis.com.br`
4. Registro DNS apontando o hostname oficial para o CloudFront
5. Role IAM com trust OIDC para GitHub Actions do repo `italofelipe/auraxis-web`

## Sequência operacional

1. Provisionar role, bucket, distribuição e DNS
2. Publicar secrets/vars no repo
3. Rodar `Deploy Official Web (AWS)` para `dev`
4. Validar smoke e rollback
5. Repetir para `pilot`
6. Promover para `prod`

## Critério de sucesso

1. Deploy executa sem credenciais locais
2. Arquivos são publicados no bucket oficial
3. CloudFront é invalidado com sucesso
4. `https://app.auraxis.com.br` responde com o build novo
5. Rollback por rerun/tag é executável em menos de 15 minutos

## Observação

Enquanto `AWS_WEB_DEPLOY_ROLE_ARN`, `AWS_WEB_DEPLOY_BUCKET` e
`AWS_WEB_CLOUDFRONT_DISTRIBUTION_ID` não existirem no repo, o workflow deve
falhar cedo com erro explícito de contrato incompleto.
