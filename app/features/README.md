# app/features

Cada subdiretório representa uma feature de produto.

Exemplos:

- `auth`
- `dashboard`
- `transactions`
- `goals`
- `wallet`
- `tools`

Dentro de cada feature, priorizamos:

- `contracts/`
- `api/`
- `model/`
- `queries/`
- `mutations/`
- `components/`

Regra:

- o fluxo principal da feature deve viver aqui;
- `app/composables/*` pode atuar como façade fino quando necessário, sem concentrar regra de negócio.
