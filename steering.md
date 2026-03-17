# steering.md — auraxis-web

Documento canônico de direção técnica do `auraxis-web`.

## Referências obrigatórias

Antes de qualquer trabalho neste repo, ler:

1. `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/06_context_index.md`
2. `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/07_steering_global.md`
3. `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/08_agent_contract.md`
4. `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/26_frontend_architecture.md`
5. `/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-web/.context/quality_gates.md`
6. `product.md`

Este repositório deve seguir os mesmos conceitos de engenharia frontend do app mobile,
conforme `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/26_frontend_architecture.md`.

## Direção arquitetural

- Organização baseada em **feature** dentro de `app/features/*`
- Infraestrutura não visual em `app/core/*`
- Elementos compartilhados em `app/shared/*`
- Composables raiz apenas como façade/entrypoint, não como acúmulo de regra de negócio
- UI deve usar Naive UI e wrappers internos; evitar HTML cru em fluxos de produto
- Regras de negócio ficam no backend; frontend orquestra, apresenta e valida na fronteira

## Estrutura alvo

```text
app/
  core/
    http/
    session/
    errors/
    config/
  features/
    auth/
    dashboard/
    transactions/
    goals/
    wallet/
    tools/
  shared/
    components/
    types/
    validators/
    utils/
  composables/
  components/
  theme/
  types/
```

> **Falha em qualquer gate = não commitar.**
> Se o bloqueio é dependência de outro time, registrar no GitHub Projects/issue do
> bloco e deixar o motivo explícito no handoff local.

## Regras operacionais

- GitHub Projects é a fonte de verdade de backlog.
- Não usar `tasks.md`.
- Toda integração de contrato deve ter:
  - tipo DTO
  - mapper/adaptador
  - testes de contrato da fronteira
- Placeholders só são aceitáveis em estado explicitamente transitório; não no fluxo nominal.
- Sessão/autenticação precisa ser resiliente a refresh e navegação.

## Qualidade

- `pnpm quality-check` antes de commit
- `pnpm build` deve permanecer verde
- testes obrigatórios para stores, adapters e contratos
- mudanças de arquitetura devem ser pequenas, reversíveis e por feature
