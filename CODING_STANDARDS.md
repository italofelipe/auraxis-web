# Coding Standards — auraxis-web

## Fontes canônicas

- Governança global: `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/07_steering_global.md`
- Arquitetura frontend transversal: `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/26_frontend_architecture.md`
- Direção local do repo: `/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-web/steering.md`
- Quality gates: `/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-web/.context/quality_gates.md`

## Regras essenciais

- TypeScript strict em todo o código
- Sem `any` implícito
- UI de produto baseada em Naive UI / wrappers internos
- Organização por feature em `app/features/*`
- Infra não visual em `app/core/*`
- Shared code em `app/shared/*`
- DTOs e mappers explícitos para contratos com API
- Testes para adapters, stores e fluxos críticos
