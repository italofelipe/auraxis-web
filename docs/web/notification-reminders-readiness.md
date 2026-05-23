# Push Readiness — Lembretes De Vencimento

Issues: #940, auraxis-api-v2#47

## Status

O Web ja possui a base de opt-in para Web Push:

- composable `usePushSubscription`;
- client REST para `POST /notifications/subscribe` e `POST /notifications/unsubscribe`;
- feature flag `NUXT_PUBLIC_PUSH_NOTIFICATIONS_ENABLED`;
- VAPID public key por `NUXT_PUBLIC_VAPID_PUBLIC_KEY`;
- tela `/settings/notifications`.

O envio real de lembretes de vencimento por push + e-mail ainda depende da API v2. A tarefa canonica e `auraxis-api-v2#47`.

## Objetivo Do Produto

Quando um gasto estiver prestes a vencer, o Auraxis deve avisar o usuario de forma clara e controlada:

- D-1 para despesas e cartoes com vencimento proximo;
- no dia do vencimento;
- e-mail como fallback quando push nao estiver autorizado;
- preferencia por usuario para evitar excesso de notificacoes.

## Contrato Esperado Da API

Backend deve entregar:

- scheduler confiavel para buscar gastos a vencer;
- preferencias por usuario/canal;
- rate-limit e deduplicacao por despesa;
- envio por push usando inscricoes registradas;
- envio por e-mail como fallback configuravel;
- observabilidade de sucesso, falha, fila e retry;
- rollback por feature flag.

## Comportamento No Web

Enquanto o backend nao estiver completo, a UI deve:

- explicar que o disparo ainda esta em preparacao quando a flag estiver desligada;
- nao tentar registrar push sem VAPID/configuracao;
- orientar que e-mail sera usado como fallback;
- permitir opt-in somente quando ambiente estiver pronto;
- manter copy sem prometer que o disparo fim a fim ja esta ativo.

## Rollback

1. Desligar `NUXT_PUBLIC_PUSH_NOTIFICATIONS_ENABLED`.
2. Manter `/settings/notifications` em estado informativo.
3. Remover a VAPID public key do ambiente se houver falha de configuracao.
4. Reverter somente a UI se ela gerar confusao; os clients de push podem permanecer inertes.
