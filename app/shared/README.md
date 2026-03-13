# app/shared

Elementos reutilizáveis entre múltiplas features.

Exemplos:

- componentes compartilhados
- tipos compartilhados
- validadores puros
- utilitários puros

Regra:

- `app/shared/*` não deve conhecer detalhes de uma feature específica;
- se algo nasceu para uma feature e só depois virou reutilizável, mover para `shared` apenas quando a reutilização estiver comprovada.
