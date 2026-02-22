# CLAUDE.md — auraxis-web

## Identidade

Repositório da aplicação web do Auraxis.
Stack: Nuxt 3 + TypeScript + Biome.

Este repo é um **submodule** de `auraxis-platform`.
Sempre trabalhe a partir da raiz da platform quando possível.

## Session Bootstrap (MANDATORY — execute em ordem)

Antes de qualquer ação, leia a partir da platform:

1. `auraxis-platform/.context/06_context_index.md` — índice de contexto
2. `auraxis-platform/.context/07_steering_global.md` — governança global
3. `auraxis-platform/.context/08_agent_contract.md` — contrato de agente
4. `auraxis-platform/.context/01_status_atual.md` — status atual
5. `auraxis-platform/.context/02_backlog_next.md` — prioridades
6. Este arquivo — diretiva do repo web

## Estrutura alvo do repo

```
auraxis-web/
  pages/         # Páginas (Nuxt file-based routing)
  components/    # Componentes reutilizáveis
  composables/   # Composables Vue (estado, lógica)
  layouts/       # Layouts base
  assets/        # Estilos globais, imagens
  public/        # Arquivos estáticos públicos
  server/        # API routes server-side (opcional)
  nuxt.config.ts # Configuração principal do Nuxt
```

## Stack e ferramentas

- **Framework**: Nuxt 3
- **Linguagem**: TypeScript strict
- **Linter/Formatter**: Biome
- **Estado**: Pinia (planejado)
- **Testes**: Vitest + Vue Test Utils (planejado)

## Operação local

```bash
# Instalar dependências
npm install

# Dev server
npm run dev

# Build
npm run build

# Preview
npm run preview

# Lint
npx biome check .
```

## Convenções

- **Commits**: Conventional Commits (`feat`, `fix`, `chore`, `docs`, `test`, `refactor`)
- **Branch**: `type/scope-descricao` (ex: `feat/auth-login-page`)
- **Nunca** commitar direto em `master`
- **Nunca** expor tokens ou segredos em código

## Limites operacionais

### Pode fazer autonomamente
- Ler qualquer arquivo do repo
- Criar/editar páginas, componentes, composables
- Atualizar documentação local
- Criar branches de feature

### Deve perguntar antes
- Mudanças em `nuxt.config.ts` com impacto em build
- Adição de módulos Nuxt com configuração externa
- Alterações em contratos com `auraxis-api`

### Nunca fazer
- Commitar direto em `master`
- Expor secrets ou chaves de API em código

## Integração com platform

Este repo é orchestrado por `auraxis-platform`.
Handoffs e decisões de arquitetura ficam em `auraxis-platform/.context/`.
Contratos de API são definidos e versionados em `auraxis-api`.
