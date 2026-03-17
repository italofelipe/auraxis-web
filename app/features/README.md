# app/features

Cada subdiretório representa uma feature de produto.

## Features canônicas

| Feature         | Status    | Descrição                               |
| :-------------- | :-------- | :-------------------------------------- |
| `auth/`         | esqueleto | Login, registro, recuperação de senha   |
| `dashboard/`    | ativo     | Visão geral financeira com períodos     |
| `wallet/`       | esqueleto | Patrimônio, posições e evolução         |
| `tools/`        | esqueleto | Ferramentas públicas e autenticadas     |
| `transactions/` | esqueleto | Lançamentos, importação e reconciliação |
| `goals/`        | esqueleto | Metas financeiras com progresso         |

## Estrutura de cada feature

```
<feature>/
  contracts/    # DTOs e tipos alinhados ao contrato da API
  api/          # API client (classe) + mapper
  model/        # Tipos de domínio (view model)
  queries/      # Vue Query hooks (useQuery/useMutation)
  components/   # Componentes Vue exclusivos desta feature
```

## Regras

- O fluxo principal da feature **deve** viver aqui.
- `app/composables/*` atua como façade fino — não como depósito de regra de negócio.
- Componentes desta camada **não** são importados diretamente por outras features;
  itens reutilizáveis migram para `app/shared/components/` quando reutilizados.
- Classes são recomendadas para API clients e mappers.
