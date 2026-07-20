# Backoffice unificado de usuários

## Escopo

A tela `/admin/users` apresenta somente dados operacionais das identidades v1/v2:
origem, métodos de autenticação, verificação de e-mail, cadastro, último login, bloqueio,
assinatura, override premium e auditoria. Dados financeiros e gestão da allowlist não fazem
parte desta interface.

## Contrato e segurança

- O cliente administrativo usa `NUXT_PUBLIC_API_V2_BASE` e os endpoints `/v2/admin/*`.
- O middleware valida a sessão em `GET /v2/admin/session`; claims de role do JWT não concedem
  acesso.
- O token bearer atual é enviado ao FastAPI. Se uma sessão originada no v1 expirar, o cliente
  tenta uma única renovação pelo fluxo existente de refresh cookie do v1.
- Todas as mutações usam `Idempotency-Key` novo por confirmação e motivo obrigatório com
  8–500 caracteres.
- A concessão premium aceita uma expiração ISO futura opcional. O override não altera cobrança,
  plano ou assinatura.
- A flag `web.admin.user-mutations` é uma proteção de rollout da interface, não uma fronteira
  de autorização. O backend sempre decide quem pode consultar e alterar dados.

## Estados de ação

Uma resposta `200` indica aplicação em todas as identidades vinculadas. Uma resposta `202`
indica reconciliação pendente; o estado durável exibido pode ser `pending` ou `partial`.
O operador deve consultar novamente o detalhe/auditoria, sem repetir manualmente a ação com
outra chave. O worker do control plane retoma os destinos incompletos.

## Rollout

1. Configurar a origem v2, CSP/CORS e a allowlist em staging.
2. Manter `web.admin.user-mutations` desativada e validar sessão, listagem, busca, filtros e
   detalhe em modo somente leitura.
3. Validar worker, Redis e conectividade de privilégio mínimo às duas bases.
4. Ativar a flag em staging e executar bloqueio/desbloqueio e grant/revoke em contas de teste.
5. Repetir o rollout em produção somente após revisar auditoria e ações parciais.

## Verificação manual

- Testar desktop e viewport mobile nos temas claro e escuro.
- Confirmar que operador fora da allowlist recebe acesso negado mesmo com JWT válido.
- Confirmar que a paginação usa o cursor retornado e que filtros reiniciam o cursor.
- Confirmar validação de motivo curto/longo e expiração passada.
- Simular `202` e conferir que a interface não anuncia conclusão total.

## Evidências visuais

- [Desktop — tema claro](../screenshots/backoffice-users-desktop-light.png)
- [Desktop — tema escuro](../screenshots/backoffice-users-desktop-dark.png)
- [Mobile — tema claro](../screenshots/backoffice-users-mobile-light.png)
- [Mobile — tema escuro](../screenshots/backoffice-users-mobile-dark.png)
