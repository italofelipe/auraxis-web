# WEB-OPS-03 - Chromatic oficial

## O que foi feito

- workflow oficial de Chromatic adicionado em `.github/workflows/chromatic.yml`
- documentação operacional criada em `docs/chromatic.md`
- `README.md` atualizado com a trilha oficial de visual review

## O que foi validado

- `CI=1 pnpm storybook:build` em cópia temporária isolada, fora de uma árvore com `.pnp.cjs` externo
- revisão estrutural do workflow e da documentação

## Riscos pendentes

- publicação real depende do secret `CHROMATIC_PROJECT_TOKEN`
- domínio customizado `v1.design-system.auraxis.com.br` depende de configuração no painel do Chromatic e DNS externo
- até o domínio estar ativo, a URL nativa do Chromatic continua sendo o fallback
- workspaces locais sob diretórios pai com `.pnp.cjs` podem contaminar o Storybook; a doc do bloco já registra a mitigação

## Próximo passo

- abrir PR do bloco
- validar run verde do workflow `Chromatic`
- conectar o domínio customizado no painel do Chromatic e no DNS
