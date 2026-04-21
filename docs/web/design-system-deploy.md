# Deploy do Design System

Runbook de rollout para publicar o Storybook em
`https://design.auraxis.com.br`. O código e os workflows já estão no
repositório — o que resta é **uma operação manual única** para criar a
infra AWS e configurar os três secrets do repo.

## Dois domínios, dois papéis

| Domínio                           | Quem serve | Papel                                                                             |
| --------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| `v1.design-system.auraxis.com.br` | Chromatic  | Visual review em PRs; histórico de baselines; CNAME para `domains.chromatic.com`. |
| `design.auraxis.com.br`           | S3 + CF    | Storybook estático público; URL institucional do DS; owned pela Auraxis.          |

Este runbook cuida do segundo. O primeiro é operado pelo painel do
Chromatic (ver `docs/chromatic.md`).

## Pré-requisitos

- ACM certificate `*.auraxis.com.br` em `us-east-1` (já existe — usado
  por `app.auraxis.com.br`).
- Hosted Zone `auraxis.com.br` no Route 53.
- Secret `AWS_WEB_DEPLOY_ROLE_ARN` configurado no repo (o mesmo usado
  pelo deploy do app — já existe).
- Role OIDC com permissões extras para este rollout:
  `cloudfront:CreateDistribution`, `s3:CreateBucket`,
  `s3:PutBucketWebsite`, `s3:PutPublicAccessBlock`,
  `route53:ChangeResourceRecordSets`. Se não tiver, ajustar no
  `auraxis-platform/infra/web/iam.tf` antes de rodar o setup.

## Passo 1 — Criar a infra AWS (`setup-design-infra.yml`)

O workflow `Setup design.auraxis.com.br infra (one-time)` cria S3 +
CloudFront + Route53 em um disparo. Rodar via `workflow_dispatch`:

1. Obter o ARN do certificado ACM e o Hosted Zone ID:
   ```bash
   aws acm list-certificates --region us-east-1 \
     --query "CertificateSummaryList[?DomainName=='*.auraxis.com.br'].CertificateArn" \
     --output text
   aws route53 list-hosted-zones-by-name --dns-name auraxis.com.br \
     --query "HostedZones[0].Id" --output text
   ```
2. Disparar o workflow com esses inputs:
   ```bash
   gh workflow run setup-design-infra.yml \
     -f acm_certificate_arn="arn:aws:acm:us-east-1:...:certificate/..." \
     -f hosted_zone_id="Z..." \
     -f dry_run=false
   ```
3. No job summary, copiar o valor impresso de
   `STORYBOOK_CF_DISTRIBUTION_ID`.

## Passo 2 — Configurar os secrets no repo

Três secrets no repositório `auraxis-web`:

| Secret                         | Valor                                                         |
| ------------------------------ | ------------------------------------------------------------- |
| `STORYBOOK_DEPLOY_BUCKET`      | `design.auraxis.com.br` (string literal do bucket).           |
| `STORYBOOK_CF_DISTRIBUTION_ID` | ID impresso no summary do passo 1.                            |
| `CHROMATIC_PROJECT_TOKEN`      | Token do projeto no painel do Chromatic → Manage → Configure. |

Comando:

```bash
gh secret set STORYBOOK_DEPLOY_BUCKET --body "design.auraxis.com.br"
gh secret set STORYBOOK_CF_DISTRIBUTION_ID --body "<id>"
gh secret set CHROMATIC_PROJECT_TOKEN --body "<token>"
```

Sem esses secrets o workflow `chromatic.yml` (job `deploy-storybook`)
emite um `::notice::` e sai — ele nunca falha por secret ausente.

## Passo 3 — Primeiro deploy

Dois gatilhos válidos:

- Push para `main` com mudança em `app/components/**`, `.storybook/**`,
  ou qualquer `*.stories.ts` (o filtro de paths do workflow).
- `workflow_dispatch`:
  ```bash
  gh workflow run chromatic.yml
  ```

O job `chromatic` publica no Chromatic (usado pelo review visual) e o
job `deploy-storybook` (só em push para `main`) sincroniza o
`storybook-static/` com o bucket e invalida a CloudFront.

## Passo 4 — Validação

- DNS: `dig +short design.auraxis.com.br` deve resolver para o domínio
  `*.cloudfront.net` criado. Propagação pode levar 5 min.
- HTTP: `curl -I https://design.auraxis.com.br` deve retornar `200` com
  `content-type: text/html` e cabeçalhos de no-cache nos HTMLs.
- Navegador: `https://design.auraxis.com.br` serve o Storybook; as
  stories carregam sem erro no console.
- Chromatic: abrir um PR com mudança visual; o comentário sticky deve
  aparecer com link do build.

## Política de cache

- Assets hash-nomeados: `public,max-age=31536000,immutable` (um ano,
  imutável). A cada build o filename muda, então não há staleness.
- HTMLs: `no-cache,no-store,must-revalidate`. CloudFront revalida em
  cada request — sem necessidade de invalidação manual em 99% dos
  deploys.
- A cada deploy o job roda `aws cloudfront create-invalidation --paths "/*"`
  só por segurança — custo ~US$ 0,005 por 1000 paths.

## Custos esperados

- S3: < 5 MB de static build → centavos/mês de storage + GETs.
- CloudFront: tráfego baixo (DS público, audiência interna + parceiros).
  Ordem de grandeza: < US$ 1/mês.
- Invalidação: 1 por deploy × 20 deploys/mês ≈ US$ 0,10/mês.
- Chromatic: plano free cobre o uso esperado (< 5k snapshots/mês com
  TurboSnap).

Total: < US$ 2/mês.

## Rollback

Se o deploy subir algo quebrado:

1. `aws s3 sync` reverte a partir do Storybook do commit anterior
   (rodar localmente apontando para o bucket).
2. Pior caso: `aws s3 rb s3://design.auraxis.com.br --force` e re-rodar
   `setup-design-infra.yml` recria o estado limpo.
3. DNS continua apontando para a distribuição; nenhum gatekeeping extra
   necessário.

## Referências

- Workflow de setup: `.github/workflows/setup-design-infra.yml`
- Workflow de deploy: `.github/workflows/chromatic.yml`
  (job `deploy-storybook`)
- Chromatic (visual review): `docs/chromatic.md`
- Issue tracker: H-P2.6 / #464
- Carta de ativação do Storybook: `docs/web/storybook-activation.md`
