# app/core

Infraestrutura transversal do `auraxis-web`.

Aqui ficam elementos não visuais e compartilhados entre features, por exemplo:

- cliente HTTP
- bootstrap de sessão
- mapeamento de erro
- configuração de runtime
- observabilidade

Regra:

- `app/core/*` não implementa regra de negócio de feature.
- `app/core/*` oferece infraestrutura reutilizável para `app/features/*`.
