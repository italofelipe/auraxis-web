# CLAUDE.md — `app/core/http`

Diretiva operacional para agentes trabalhando no cliente HTTP central.
Complementa `app/core/README.md` com regras específicas de execução.

## Papel

`app/core/http/http-client.ts` é o **único** ponto canônico que cria
instâncias Axios para falar com `auraxis-api`. Toda feature deve usar este
cliente — direta ou indiretamente via hook de `app/features/*/queries/`.

Responsabilidades atuais:

- Normalização da base URL (tira trailing slashes).
- Injeção do header `Authorization: Bearer <token>` via interceptor de request.
- Injeção do header de contrato v2 global.
- Registro dos interceptors de response (403 → toast, 5xx → toast/observability).
- Exposição de hook para o consumer fornecer `getAccessToken()` lazy.

## Regras obrigatórias

- **Um único cliente por runtime.** Não crie novos `axios.create()` em
  features. Se precisar de comportamento diferente, estenda este arquivo
  com um parâmetro de opções.
- **Interceptors ficam em `app/core/api/interceptors.ts`.** Não escreva
  interceptor dentro de feature — se for transversal, promova aqui.
- **401 é intencionalmente excluído** do handler global. Endpoints de auth
  (ex.: `/auth/login`) devolvem 401 como resposta legítima — feature
  trata localmente.
- **Sempre devolver `ApiError` normalizado.** Feature `catch` deve poder
  assumir `error instanceof ApiError`. Não vaze erro cru do Axios.
- **Sem lógica de cache aqui.** Cache é responsabilidade de Vue Query
  (camada `queries/` de cada feature).

## O que fazer autonomamente

- Adicionar novos interceptors transversais (observability, trace IDs).
- Ajustar normalização de URL / headers globais.
- Estender opções do factory com novos parâmetros opcionais.
- Criar testes em `__tests__/` para cada interceptor e para o factory.

## O que perguntar antes

- Mudar a política de 401 (afeta fluxo de auth).
- Mudar o formato do bearer token (afeta backend e todas as features).
- Substituir Axios por outro client (decisão arquitetural com blast radius total).
- Adicionar retry automático (pode mascarar idempotência de mutations).

## O que nunca fazer

- Expor tokens em log, console, ou breadcrumb do Sentry.
- Persistir o token dentro deste módulo — token vive em `app/core/session/`.
- Injetar dependência concreta de Pinia/Nuxt runtime — passe via argumento.
- Adicionar fallback silencioso que esconda erro de rede real.

## Testing checklist

Cada mudança neste módulo deve rodar:

```bash
pnpm test -- app/core/http
pnpm test -- app/core/api
pnpm typecheck
```

Antes de PR:

```bash
pnpm quality-check
```

## Referências

- Interceptors: `app/core/api/interceptors.ts`
- Tipos de opções: `app/core/api/types.ts`
- Erro normalizado: `app/core/errors/api-error.ts`
- Sessão e bearer token: `app/core/session/`
- Observabilidade: `app/core/observability/`
