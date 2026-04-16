# CLAUDE.md — `app/features/*`

Diretiva operacional para agentes trabalhando dentro da camada de features.
Complementa `README.md` (que descreve convenções) com regras de execução.

## Papel da camada

`app/features/*` concentra todo fluxo principal de cada domínio de produto.
Cada pasta representa uma feature autônoma (ex.: `transactions/`, `goals/`),
com contratos, queries, componentes e utilitários próprios.

## Estrutura canônica por feature

```
<feature>/
  contracts/     # DTOs e tipos alinhados ao contrato REST/GraphQL
  api/           # API client (classe) + mapper DTO → domínio
  services/      # Regras de negócio puras (sem Vue)
  model/         # Tipos de domínio (view model)
  queries/       # Vue Query hooks (useQuery / useMutation)
  composables/   # Estado reativo e orquestração fina (hooks Vue)
  components/    # Componentes Vue exclusivos da feature
  utils/         # Helpers puros escopados à feature
```

Não exigido: todos existirem. Criar apenas o que a feature precisa.

## Regras obrigatórias

- **Sem import lateral entre features.** `transactions/` não importa de `goals/`.
  Se algo for reutilizável, promover para `app/shared/` ou `app/core/`.
- **Composables são façade fina.** Regras de negócio vão para `services/`
  ou `queries/`. Não empilhe lógica dentro de `composables/`.
- **Contratos primeiro.** DTOs em `contracts/` refletem o schema do backend.
  Nunca manipule payloads crus fora desta pasta — sempre passe pelo mapper.
- **Mappers são puros.** `api/*.mapper.ts` não conhece Vue, Pinia ou cache.
  Recebe DTO, devolve domínio.
- **Queries são os únicos pontos que tocam API + cache.** `queryKey` começa
  com o nome da feature (ex.: `["transactions", ...]`).
- **Coverage ≥ 85%.** Cada service, mapper e query deve ter testes unitários.
  Componentes que renderizam estado derivado também.

## O que fazer autonomamente

- Criar/editar componentes, composables, services, queries, contratos e mappers.
- Adicionar testes unitários com Vitest no mesmo diretório da unidade.
- Refatorar dentro da feature sem afetar outras.
- Estender tipos de domínio em `model/` quando o contrato evoluir.

## O que perguntar antes

- Mover código de uma feature para `app/shared/` ou `app/core/`.
- Renomear uma pasta de feature (pode quebrar rotas).
- Introduzir nova biblioteca de estado (preferimos Pinia + Vue Query existentes).
- Criar um novo endpoint no backend (coordenar com `auraxis-api`).

## O que nunca fazer

- Importar `store` do Pinia diretamente em componentes quando já existe `queries/`.
- Fazer fetch via `$fetch` / `useFetch` direto — sempre usar `httpClient`
  do `app/core/http` via hook de feature.
- Criar `any` explícito; usar tipos do contrato ou `unknown` + narrowing.
- Duplicar tipos que já existem em `app/shared/types/generated/`.
- Adicionar comentário JSDoc só para passar lint — escreva código claro.

## Testing checklist

Antes de commitar uma mudança em `app/features/*`:

```bash
pnpm lint
pnpm typecheck
pnpm test -- <pasta-da-feature>
```

Antes de abrir PR:

```bash
pnpm quality-check
```

## Referências rápidas

- Contratos gerados: `app/shared/types/generated/openapi.ts`
- Infra HTTP: `app/core/http/http-client.ts` (ver CLAUDE.md local)
- Façades de sessão/observabilidade: `app/core/session/`, `app/core/observability/`
- Testes E2E relacionados: `e2e/specs/*` (Playwright)
