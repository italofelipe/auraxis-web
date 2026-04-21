# Chromatic e Storybook

## Objetivo

Publicar o Storybook do `auraxis-web` no Chromatic como trilha oficial de visual review contínuo.

## Superfícies oficiais

- domínio alvo (Chromatic, visual review): `https://v1.design-system.auraxis.com.br`
- fallback operacional: URL nativa do Chromatic gerada em cada build
- domínio público do Storybook (S3 + CloudFront): `https://design.auraxis.com.br`
  — operado por este repositório; rollout descrito em
  `docs/web/design-system-deploy.md`.

## Workflow

Arquivo oficial:

- `.github/workflows/chromatic.yml`

Gatilhos:

- `pull_request` para `main` e `master`
- `push` para `main` e `master`
- `workflow_dispatch`

Comportamento:

- usa `CHROMATIC_PROJECT_TOKEN` como secret obrigatório para publicação real
- sem o secret, o workflow faz `skip` com notice explícito em vez de falhar ruidosamente
- roda `pnpm install --frozen-lockfile`
- publica o Storybook via `chromaui/action`
- gera resumo com `buildUrl` e `storybookUrl` no `Step Summary`

Observação importante:

- para reprodutibilidade, a action fica pinada em `chromaui/action@v16`, evitando drift silencioso de `@latest`

## Build canônico

O build oficial do Storybook é:

```bash
pnpm storybook:build
```

Esse comando é a fonte de verdade para CI e troubleshooting local.

### Nota sobre ambientes locais com Yarn PnP externo

Se existir um arquivo `.pnp.cjs` em algum diretório pai do projeto, o Storybook pode falhar com erros do tipo
`Yarn Plug'n'Play manifest forbids importing ...`, mesmo quando o `auraxis-web` usa `pnpm`.

Isso não é um bug intrínseco do repositório; é contaminação do ambiente de execução.

Quando isso acontecer:

1. rode o build em um clone/cópia temporária fora dessa árvore pai, ou
2. remova/renomeie o `.pnp.cjs` do diretório pai responsável, se isso for seguro no seu ambiente.

O workflow de CI/Chromatic roda em ambiente limpo e é a validação canônica da publicação.

## Política de visual review

- mudanças visuais devem aparecer no Chromatic para revisão em PR
- o workflow usa `onlyChanged: true` para reduzir tempo e custo de captura
- o workflow usa `exitZeroOnChanges: true` para que diferenças visuais esperadas não bloqueiem automaticamente o pipeline
- erros reais de build/publicação continuam bloqueando o job

## Segredos e configuração

Secret obrigatório:

- `CHROMATIC_PROJECT_TOKEN`

Configuração externa necessária:

- projeto Chromatic conectado ao repositório `auraxis-web`
- domínio customizado `v1.design-system.auraxis.com.br` configurado no painel do Chromatic
- DNS com `CNAME` apontando para `domains.chromatic.com`

## Observações de domínio

- o domínio customizado aponta para a build mais recente de uma branch alvo escolhida no Chromatic
- a recomendação é usar `main` como branch canônica do domínio
- até o domínio estar ativo, a URL nativa do Chromatic continua sendo a referência operacional

## Checklist de rollout

1. configurar `CHROMATIC_PROJECT_TOKEN` no GitHub
2. validar run verde do workflow `Chromatic`
3. confirmar publicação da URL nativa do Storybook no Chromatic
4. configurar `v1.design-system.auraxis.com.br` no painel do Chromatic
5. criar `CNAME` DNS para `domains.chromatic.com`
6. validar acesso pelo domínio customizado
