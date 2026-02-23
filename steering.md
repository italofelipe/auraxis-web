# steering.md — auraxis-web

## Princípios técnicos

- **TypeScript strict** em todo o código (`strict: true` no tsconfig).
- **Nuxt 4** como framework (SSR/SPA conforme necessidade).
- **@nuxt/eslint** para lint (integrado ao Nuxt) + **Prettier** para formatação.
- **Sem lógica de negócio no frontend** — toda regra fica em auraxis-api.
- **Contratos de API**: consumir apenas endpoints documentados e versionados em auraxis-api.
- **Testes**: Vitest + Vue Test Utils.
- **Estado global**: Pinia stores (um store por domínio).

## Convenções de código

- Páginas em `pages/` (Nuxt file-based routing).
- Componentes reutilizáveis em `components/`.
- Estado global em `composables/` ou Pinia stores.
- Layouts em `layouts/`.
- Tipos e interfaces em `types/` (nunca inline em componentes).
- Serviços HTTP em `services/` (um arquivo por domínio de API).
- Variáveis de ambiente prefixadas com `NUXT_PUBLIC_` (cliente) ou `NUXT_` (servidor).

## Quality Gates (obrigatórios antes de todo commit)

```bash
# 1. Lint (@nuxt/eslint)
pnpm lint

# 2. Type-check
pnpm typecheck

# 3. Testes unitários
pnpm test

# 4. Build de verificação (detecta erros de importação/SSR)
pnpm build

# Comando combinado (rodar sempre antes de commitar):
pnpm quality-check
```

> **Falha em qualquer gate = não commitar.** Registrar o bloqueio em `tasks.md` se for dependência de outro time.

### Thresholds

| Gate                  | Threshold                | Observação                                           |
| :-------------------- | :----------------------- | :--------------------------------------------------- |
| ESLint (@nuxt/eslint) | 0 erros                  | Warnings aceitos com consciência                     |
| TypeScript            | 0 erros                  | `strict: true` obrigatório                           |
| Vitest                | 100% dos testes passando | Coverage mínimo: não definido até suite estabelecida |
| Build                 | Sucesso                  | Sem erros de SSR ou importação circular              |

## Integrações externas

- **auraxis-api**: única fonte de verdade para dados.
- **Deploy**: a definir (Vercel / AWS / VPS).

## Segurança

- Nunca expor tokens ou chaves de API no client-side.
- Usar variáveis de ambiente do servidor (`NUXT_`) para segredos.
- CORS configurado pelo lado da API — não replicar no client.
- Nunca commitar `.env`, `.env.local`, `.env.production`.
- Dados sensíveis (tokens JWT) em `httpOnly cookies` — nunca em `localStorage`.

## Referências

- Governança global: `auraxis-platform/.context/07_steering_global.md`
- Contrato de agente: `auraxis-platform/.context/08_agent_contract.md`
- Definição de pronto: `auraxis-platform/.context/23_definition_of_done.md`
- Workflow de sessão: `auraxis-platform/workflows/agent-session.md`
