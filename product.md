# Product Brief — auraxis-web

## Objetivo

Aplicacao web para gestao financeira com foco em visao consolidada, metas e operacao segura em ambiente SSR.

## Escopo atual (MVP)

- Autenticacao web
- Dashboard com saldo e transacoes
- Metas financeiras
- Consumo da API Auraxis via composable HTTP padronizado
- Hospedagem web em AWS desde o dia 0 (sem Vercel/GitHub Pages)

## Arquitetura de superficie (MVP)

- Paginas publicas:
  - institucional (SEO obrigatorio)
  - area publica de ferramentas (teaser/uso inicial)
  - landing de newsletter (escopo em discovery)
- Paginas privadas (login obrigatorio):
  - dashboard e fluxos financeiros
  - area logada de ferramentas com simulacoes persistiveis

## Fora de escopo imediato

- Open Finance nativo
- Personalizacao visual avancada
- Automacao de investimentos em tempo real
- Publicacao iOS/App Store no ciclo atual

## Itens em discovery para refinamento (pos ciclo atual)

- J6: paginas publicas/privadas + SEO institucional
- J7: ferramentas hibridas (publico/logado) com simulacao persistivel
- J8: newsletter e growth loop

## Principios de UX

- Informacao financeira legivel e objetiva
- Estados de erro/loading previsiveis
- Performance e acessibilidade como default

## Dependencias externas

- `auraxis-api` para contratos REST
- Variaveis publicas apenas via `NUXT_PUBLIC_*`
