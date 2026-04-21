# Preview deploys per PR

Cada PR aberto contra `main`/`master` publica um build estático SSG em
`s3://app.auraxis.com.br/_preview/pr-{N}/`, acessível via CloudFront no mesmo
host da produção. URL e status são reportados via comentário sticky no PR.

## Fluxo

```
PR opened/synchronize/reopened ──► preview-deploy.yml ──► pnpm generate
                                                          │
                                                          ▼
                                         aws s3 sync → _preview/pr-{N}/
                                                          │
                                                          ▼
                                         comentário sticky com preview URL
```

```
PR closed/merged ──► preview-cleanup.yml ──► aws s3 rm --recursive
                                                   │
                                                   ▼
                                      comentário atualizado (removido)
```

## Workflows

| Arquivo                                 | Trigger                 | O que faz                               |
| --------------------------------------- | ----------------------- | --------------------------------------- |
| `.github/workflows/preview-deploy.yml`  | PR opened/sync/reopened | Build + upload + comentário com URL     |
| `.github/workflows/preview-cleanup.yml` | PR closed               | Remove prefixo S3 + atualiza comentário |

## Infraestrutura e secrets

- **Bucket S3:** `app.auraxis.com.br` (mesmo bucket da produção — prefixo
  `_preview/pr-{N}/` isolado do deploy real em `/`).
- **CloudFront:** distribuição de produção serve os arquivos do bucket; o
  prefixo aparece em `https://app.auraxis.com.br/_preview/pr-{N}/`.
- **IAM (OIDC):** role `AuraxisWebDeployRole` (trust policy em
  `auraxis-platform/infra/web/iam.tf`) whitelista o ambiente GitHub `preview`.
- **Secret necessário:** `AWS_WEB_DEPLOY_ROLE_ARN` no ambiente `preview`.
  Sem ele, o workflow posta um `::notice::` e sai (fork PRs seguem seguras).

## Cache e propagação

- Todos os arquivos de preview são enviados com
  `Cache-Control: no-cache, no-store, must-revalidate` — CloudFront não precisa
  de invalidação a cada push.
- O build ID (`pr-{N}-{sha}`) é gravado na meta `x-build-id` do HTML para que
  seja possível identificar a versão exata exposta.

## SEO e isolamento da produção

- `nuxt.config.ts → site.indexable` fica `false` quando
  `NUXT_PUBLIC_APP_ENV === "preview"` — o módulo @nuxtjs/robots emite
  `Disallow: /` e cada HTML recebe `<meta name="robots" content="noindex,nofollow">`.
  Sem isso, previews poderiam ser indexados e competir com a versão live.
- `NUXT_APP_BASE_URL=/_preview/pr-{N}/` garante que assets resolvam no prefixo
  correto (sem colidir com bundles da produção em `/`).
- Preview NÃO invalida cache da produção: o deploy de produção
  (`deploy.yml`) continua servindo o prefixo raiz.

## Custos

- Bucket: <1 MB por PR em média (SSG comprimido). Com 10 PRs abertos
  simultâneos, ~10 MB × USD 0,023/GB/mês ≈ **USD 0,000002/mês**. Desprezível.
- CloudFront: cache-hit baixo (no-cache), mas tráfego de preview é apenas o
  próprio reviewer. Ordem de grandeza: centavos/mês.
- Cleanup automático remove os objetos no fechamento do PR.

## Troubleshooting

**"Preview deploy skipped: AWS_WEB_DEPLOY_ROLE_ARN not available"**

- PR vindo de fork (secrets não disponíveis por padrão). Esperado.
- Se for PR interno: verificar se o ambiente `preview` do repositório tem o
  secret configurado em Settings → Environments → preview.

**Preview URL retorna 403/NoSuchKey**

- O job pode ter falhado antes do `aws s3 sync`. Verificar logs do
  workflow `Preview Deploy (per-PR)`.
- O cleanup pode ter rodado antes por PR fechado/reopened. Dar push novo no
  PR para re-triggerar o deploy.

**Rotas Vue 404 ao navegar client-side**

- Confirmar que `NUXT_APP_BASE_URL` está sendo respeitado nas rotas — links
  absolutos começando com `/` ignoram o baseURL e quebram no prefixo.

## Referências

- Workflow de deploy: `.github/workflows/preview-deploy.yml`
- Workflow de cleanup: `.github/workflows/preview-cleanup.yml`
- Trust policy IAM: `auraxis-platform/infra/web/iam.tf`
- Issue tracker: H-P4.4 / #467
