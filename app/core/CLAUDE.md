# CLAUDE.md — `app/core/*`

Infraestrutura não-visual do auraxis-web. Modificações aqui afetam toda a aplicação.

## Módulos

| Módulo                    | Responsabilidade                                        |
| ------------------------- | ------------------------------------------------------- |
| `app/core/http/`          | HTTP client com auth interceptors (ver CLAUDE.md local) |
| `app/core/session/`       | Gerenciamento de sessão e tokens                        |
| `app/core/observability/` | Sentry, analytics                                       |
| `app/core/errors/`        | ApiError e helpers de diagnóstico                       |
| `app/core/config/`        | Wrappers tipados de useRuntimeConfig()                  |
| `app/core/query/`         | Configuração global do TanStack Query                   |
| `app/core/validation/`    | Validadores de fronteira (zod schemas)                  |
| `app/core/security/`      | Helpers de segurança (sanitização, CSP)                 |
| `app/core/api/`           | Base clients e interceptors compartilhados              |

## Regras

- Nunca importar de `app/features/` dentro de `app/core/`
- Mudanças em `app/core/http/` exigem testes de integração com interceptors
- Mudanças em `app/core/session/` exigem aprovação — afeta auth flow
- Toda adição de módulo novo requer entrada neste arquivo

## O que perguntar antes

- Qualquer modificação em `app/core/session/`
- Adicionar novo módulo em `app/core/`
- Mudar interceptors HTTP
