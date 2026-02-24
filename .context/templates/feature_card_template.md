# Feature Card Template — auraxis-web

## [WEB-FEAT-XXX] Titulo da Feature

**Status:** backlog | in_progress | blocked | done  
**Prioridade:** P0 | P1 | P2 | P3  
**Tamanho:** S | M | L | XL  
**Agente responsavel:** Claude | Gemini | GPT | CrewAI | unassigned  
**Branch:** tipo/escopo-curto  
**Spec tecnica:** link opcional para documento detalhado

### 1. Contexto

- Problema:
- Objetivo:
- Usuarios impactados:

### 2. Criterios de aceite

- [ ] AC1:
- [ ] AC2:
- [ ] AC3:

### 3. Impacto tecnico esperado

| Area                       | Impacto | Risco se errado |
| :------------------------- | :------ | :-------------- |
| Pages/Layouts              |         |                 |
| Composables/Stores         |         |                 |
| Integracao API             |         |                 |
| SSR/Nitro                  |         |                 |
| Testes (Vitest/Playwright) |         |                 |

### 4. Contrato e seguranca

- Endpoint(s) consumidos:
- Campos obrigatorios do contrato:
- Estrategia de sessao: cookie `httpOnly` quando aplicavel
- Dados sensiveis envolvidos:

### 5. Breakdown de execucao

| #   | Tarefa | Validacao            | Status |
| :-- | :----- | :------------------- | :----: |
| 1   |        | `pnpm lint`          |   ⚪   |
| 2   |        | `pnpm typecheck`     |   ⚪   |
| 3   |        | `pnpm test:coverage` |   ⚪   |
| 4   |        | `pnpm build`         |   ⚪   |

### 6. Riscos e mitigacoes

- Risco:
- Mitigacao:
- Dependencias externas:

### 7. Observacoes para handoff

- Estado atual:
- Proximo passo objetivo:
- Bloqueios:
