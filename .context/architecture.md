# architecture.md — auraxis-web

## Stack

| Camada | Tecnologia | Versão alvo |
|:-------|:-----------|:------------|
| Framework | Nuxt 3 | latest stable |
| Linguagem | TypeScript | strict mode |
| Lint/Format | Biome | latest |
| Testes | Vitest + Vue Test Utils | latest |
| Estado | Pinia | latest |
| HTTP client | $fetch (Nuxt built-in) ou ofetch | built-in |
| Deploy | A definir (Vercel / AWS / VPS) | — |

## Estrutura de diretórios

```
auraxis-web/
  pages/         # Páginas — Nuxt file-based routing
  components/    # Componentes Vue reutilizáveis
  composables/   # Composables (lógica reativa compartilhada)
  layouts/       # Layouts base (default, auth, etc.)
  assets/        # Estilos globais, imagens
  public/        # Arquivos estáticos (favicon, etc.)
  server/        # API routes server-side (se necessário)
  services/      # Clientes HTTP por domínio (ex: auth.service.ts)
  types/         # Tipos e interfaces TypeScript
  stores/        # Pinia stores (um por domínio)
  nuxt.config.ts # Configuração principal
  biome.json     # Configuração do Biome
  tsconfig.json  # TypeScript config (strict: true obrigatório)
```

## Fluxo de dados

```
UI (pages/ + components/)
  → stores/ (Pinia — estado global)
    → services/ (HTTP calls para auraxis-api)
      → auraxis-api (fonte única de verdade)
```

## Decisões de arquitetura

| Decisão | Escolha | Motivo |
|:--------|:--------|:-------|
| Lint/Format | Biome (único) | Sem Prettier + ESLint separados — menos config, mais rápido |
| Estado global | Pinia | Vue 3 nativo, TypeScript first |
| HTTP | $fetch / ofetch | Built-in Nuxt, SSR-aware |
| Auth tokens | httpOnly cookies | Não expõe em JS client-side |
| Tipagem | strict: true | Sem `any`, inferência máxima |

## Contratos com auraxis-api

- Consumir apenas endpoints documentados em `auraxis-api/schema.graphql` ou OpenAPI spec.
- Não criar lógica de negócio no frontend — apenas apresentação e orchestração de chamadas.
- Versionar chamadas de API via header ou path — não assumir contrato estável sem versão.
