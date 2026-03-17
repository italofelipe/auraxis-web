# app/core

Infraestrutura transversal do `auraxis-web`.

Aqui ficam elementos não visuais e compartilhados entre features.
Nenhum módulo de `core` implementa regra de negócio de feature.

## Subdiretórios

| Diretório        | Responsabilidade                                           |
| :--------------- | :--------------------------------------------------------- |
| `http/`          | Cliente HTTP centralizado (Axios) com auth interceptor     |
| `session/`       | Facade de sessão — re-exporta `useSessionStore`            |
| `config/`        | Wrappers tipados sobre `useRuntimeConfig()`                |
| `errors/`        | Classes de erro de infra (`ApiError`) e helpers            |
| `observability/` | Sentry thin-wrappers (`captureException`, `addBreadcrumb`) |

## Regras

- `app/core/*` **não** conhece detalhes de negócio de nenhuma feature.
- `app/core/*` oferece infraestrutura reutilizável para `app/features/*`.
- Nenhum componente Vue vive aqui.
- Classes são apropriadas neste nível (API clients, mappers, adapters).
