# Frontend Contracts (Web)

Este diretório versiona os artefatos usados pelo gate de contrato no `auraxis-web`.

## Arquivos

- `openapi.snapshot.json`: snapshot canônico da API para geração de tipos.
- `feature-contract-baseline.json`: baseline dos `Feature Contract Packs` consumidos.

## Comandos

- `pnpm contracts:sync`: atualiza snapshot/tipos/baseline.
- `pnpm contracts:check`: valida drift de contrato (CI bloqueante).
