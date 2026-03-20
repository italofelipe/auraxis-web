# Product Brief — auraxis-web

## Objetivo

Aplicação web do Auraxis para gestão financeira pessoal com foco em clareza, confiança e visão consolidada do mês.

## Escopo atual

- Autenticação web
- Dashboard financeira com saldo e transações
- Transações
- Metas financeiras
- Carteira/patrimônio
- Ferramentas públicas como topo de funil (em evolução)
- Consumo da API Auraxis via composable HTTP padronizado
- Hospedagem web oficial em AWS/CloudFront

## Superfícies

- `app.auraxis.com.br` = aplicação autenticada
- `auraxis.com.br` = institucional

### Páginas públicas

- institucional (SEO obrigatório)
- área pública de ferramentas
- landing de newsletter (escopo em discovery / MVP2)

### Páginas privadas (login obrigatório)

- dashboard e fluxos financeiros
- salvamento de simulações como metas
- integrações com dados reais e experiências premium

## Estratégia de produto

- ferramentas podem ser públicas
- usuário logado pode salvar contexto e resultados
- premium integra ferramentas ao dashboard e aos dados reais do usuário

## Fora de escopo imediato

- Open Finance nativo
- ERP/contabilidade completa
- cartão de crédito dentro do pacote atual da dashboard
