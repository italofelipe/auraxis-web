# steering.md — auraxis-web

## Princípios técnicos

- **TypeScript strict** em todo o código.
- **Nuxt 3** como framework (SSR/SPA conforme necessidade).
- **Biome** para lint e formatação (sem ESLint/Prettier separados).
- **Sem lógica de negócio no frontend** — toda regra fica em auraxis-api.
- **Contratos de API**: consumir apenas endpoints documentados e versionados em auraxis-api.
- **Testes**: Vitest + Vue Test Utils (a implementar).

## Convenções de código

- Páginas em `pages/` (Nuxt file-based routing).
- Componentes reutilizáveis em `components/`.
- Estado global em `composables/` ou Pinia stores (a definir).
- Layouts em `layouts/`.

## Integrações externas

- **auraxis-api**: única fonte de verdade para dados.
- **Deploy**: a definir (Vercel / AWS / VPS).

## Segurança

- Nunca expor tokens ou chaves de API no client-side.
- Usar variáveis de ambiente do servidor para segredos.
- CORS configurado pelo lado da API.

## Referências

- Governança global: `auraxis-platform/.context/07_steering_global.md`
- Contrato de agente: `auraxis-platform/.context/08_agent_contract.md`
