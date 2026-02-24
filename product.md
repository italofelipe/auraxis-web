# Product Brief — auraxis-web

## Objetivo

Aplicacao web para gestao financeira com foco em visao consolidada, metas e operacao segura em ambiente SSR.

## Escopo atual (MVP)

- Autenticacao web
- Dashboard com saldo e transacoes
- Metas financeiras
- Consumo da API Auraxis via composable HTTP padronizado

## Fora de escopo imediato

- Open Finance nativo
- Personalizacao visual avancada
- Automacao de investimentos em tempo real

## Principios de UX

- Informacao financeira legivel e objetiva
- Estados de erro/loading previsiveis
- Performance e acessibilidade como default

## Dependencias externas

- `auraxis-api` para contratos REST
- Variaveis publicas apenas via `NUXT_PUBLIC_*`
