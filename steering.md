# steering.md — auraxis-web

> Documento canônico de governança técnica para o projeto web do Auraxis.
> Vinculante para todos os agentes e desenvolvedores.
> Atualizado: 2026-02-24

---

## Stack técnica

| Camada                 | Tecnologia                | Versão                 |
| :--------------------- | :------------------------ | :--------------------- |
| Framework              | Nuxt 4 (SSR)              | ^4.3.1                 |
| Linguagem              | TypeScript strict         | ^5.8                   |
| Gerenciador de pacotes | pnpm                      | 10.30.1                |
| Lint                   | @nuxt/eslint              | 1.15.1                 |
| Formatação             | Prettier                  | ^3.8                   |
| Testes unitários       | Vitest + @nuxt/test-utils | ^4.0                   |
| Testes E2E             | Playwright                | ^1.58                  |
| UI base                | Chakra UI (customizado)   | ^3.x                   |
| Estado de servidor     | TanStack Query (Vue)      | ^5.x                   |
| Estado global          | Pinia                     | via @pinia/nuxt        |
| Análise estática       | SonarCloud                | —                      |
| Secret scan            | Gitleaks + TruffleHog     | —                      |
| Performance            | Lighthouse CI             | —                      |
| Dep update             | Dependabot                | auto-merge patch/minor |

---

## Diretriz de UI e Design System

- Paleta oficial: `#262121`, `#ffbe4d`, `#413939`, `#0b0909`, `#ffd180`, `#ffab1a`.
- Tipografia oficial: `Playfair Display` (headings) + `Raleway` (body).
- Grid base: `8px` (spacing estrutural sempre em múltiplos de 8).
- Tema obrigatório e modular: `app/theme/tokens/colors.ts`, `typography.ts`, `spacing.ts`, `radii.ts`, `shadows.ts`, `motion.ts`.
- `app/theme/index.ts` deve ser apenas barrel de exportação. Proibido concentrar definição de tokens nesse arquivo.
- Componentes web devem derivar de base **Chakra UI customizada** (tokens Auraxis).
- Em ausência de Chakra UI estável para Vue/Nuxt, usar biblioteca equivalente de mercado (Vuetify/Naive UI/PrimeVue) com wrappers internos.
- Componentes novos devem partir da UI library oficial do projeto; customizações devem ser feitas por extensão/composição, não por reimplementação ad-hoc.
- Em telas/componentes de produto, evitar tags HTML cruas de formulário/controle/texto estrutural (`<input>`, `<label>`, `<button>`, `<textarea>`, `<select>`, `<p>`). Usar componentes Chakra UI (ou wrappers internos).
- É proibido usar valores literais de cor, spacing, radius, shadow, font-size e line-height em componentes/páginas. Usar tokens semânticos.
- É proibido introduzir escala de cores de brand fora da paleta oficial. Não criar gradientes/hues ad-hoc fora dos tokens aprovados.
- Código de produto deve ser TypeScript-only (`.ts`/`.tsx` em código de app). `.js`/`.jsx` não são permitidos para implementação de features.
- Toda função deve declarar tipo explícito de retorno e possuir JSDoc.
- Código reutilizado em múltiplos fluxos deve ficar em `app/shared` (`components`, `types`, `validators`, `utils`).
- **Tailwind não é permitido** neste repositório.
- Estado remoto (`server-state`) deve ser resolvido com `@tanstack/vue-query`.

---

## Princípios técnicos

- **TypeScript strict** em todo o código — `strict: true` no tsconfig, sem exceções.
- **Sem lógica de negócio no frontend** — toda regra de negócio fica em `auraxis-api`.
- **Contratos de API**: consumir apenas endpoints documentados e versionados.
- **SSR-first**: comportamento de servidor deve ser testado antes do comportamento de cliente.
- **Acessibilidade é requisito** — não é opcional. Threshold Lighthouse a11y ≥ 90.
- **Performance como gate** — LCP ≤ 4s, CLS ≤ 0.1 (Core Web Vitals obrigatórios).
- **Segurança por padrão** — secret scan automático, CVEs bloqueados em PRs.
- **Testes não são opcionais** — toda lógica nova tem teste antes de merge.
- **UI consistente por contrato** — Chakra UI customizado + tokens oficiais são obrigatórios.
- **Token-first styling** — qualquer estilo visual deve usar tokens do tema; valores soltos no código são não conformidade.
- **Server-state com TanStack Query** — Pinia fica para estado de cliente e orquestração local.

---

## Convenções de código

| Diretório       | O que vai aqui                                                  |
| :-------------- | :-------------------------------------------------------------- |
| `app/`          | Entry point da aplicação                                        |
| `pages/`        | Rotas (Nuxt file-based routing)                                 |
| `components/`   | Componentes reutilizáveis                                       |
| `composables/`  | Lógica de estado local e side-effects                           |
| `stores/`       | Estado global de cliente via Pinia (um store por domínio)       |
| `theme/`        | Tokens de design (paleta, tipografia, spacing, radius, shadow)  |
| `layouts/`      | Layouts de página                                               |
| `types/api/`    | Tipos do contrato com auraxis-api (snake_case, strings de data) |
| `types/domain/` | Tipos de domínio frontend (camelCase, objetos estruturados)     |
| `services/`     | Chamadas HTTP (um arquivo por domínio de API)                   |
| `utils/`        | Funções puras sem side-effects                                  |
| `e2e/`          | Testes Playwright (separados de testes unitários)               |

**Variáveis de ambiente:**

- `NUXT_PUBLIC_*` → exposta ao cliente (nunca dados sensíveis)
- `NUXT_*` → apenas no servidor (tokens, chaves de API)

---

## Quality Gates — obrigatórios antes de todo commit

Execute na ordem:

```bash
# 1. Lint
pnpm lint

# 2. Type-check
pnpm typecheck

# 3. Testes unitários com coverage
pnpm test:coverage

# 4. Governança frontend (TS-only + shared-first)
pnpm policy:check

# Comando combinado (obrigatório antes de commitar):
pnpm quality-check
```

> **Falha em qualquer gate = não commitar.**
> Se o bloqueio é dependência de outro time, registrar em `tasks.md` e abrir issue.

### Thresholds locais (pre-commit)

| Gate                       | Threshold | Falha quando                                                          |
| :------------------------- | :-------- | :-------------------------------------------------------------------- |
| ESLint (@nuxt/eslint)      | 0 erros   | Qualquer violação de lint                                             |
| Frontend governance        | 0 erros   | Arquivo `.js/.jsx` em código de produto ou ausência de `app/shared/*` |
| TypeScript strict          | 0 erros   | `any` implícito, tipos incompatíveis                                  |
| Vitest — testes passando   | 100%      | Qualquer teste quebrando                                              |
| Vitest — coverage lines    | ≥ 85%     | Cobertura abaixo do threshold                                         |
| Vitest — coverage branches | ≥ 85%     | Cobertura de branches abaixo                                          |
| Build Nuxt                 | Sucesso   | Import circular, erro SSR, módulo ausente                             |

### Thresholds de CI (automáticos — GitHub Actions)

| Gate CI                     | Threshold         | Job                       |
| :-------------------------- | :---------------- | :------------------------ |
| Lighthouse — Performance    | ≥ 80              | `lighthouse`              |
| Lighthouse — Acessibilidade | ≥ 90              | `lighthouse`              |
| Lighthouse — SEO            | ≥ 90              | `lighthouse`              |
| LCP (Core Web Vital)        | ≤ 4.000 ms        | `lighthouse`              |
| CLS (Core Web Vital)        | ≤ 0.1             | `lighthouse`              |
| Bundle public (client)      | ≤ 3 MB hard limit | `bundle-analysis`         |
| CVEs em novas deps          | 0 high/critical   | `dependency-review`       |
| Secrets detectados          | 0                 | `gitleaks` + `trufflehog` |
| SonarCloud quality gate     | Pass              | `sonarcloud`              |

---

## Pipeline CI — 12 jobs

```
push / PR → master
│
├── lint              (@nuxt/eslint — 0 erros)
├── typecheck         (nuxt typecheck — 0 erros)
├── test              (vitest + coverage ≥ 85%)
│
├── build             (nuxt build — depende de lint + typecheck + test)
│   ├── bundle-analysis   (comenta tamanho no PR; hard limit 3 MB)
│   ├── lighthouse        (Perf ≥ 80, A11y ≥ 90, SEO ≥ 90)
│   └── e2e               (Playwright — Chromium + mobile viewport)
│
├── secret-scan-gitleaks
├── secret-scan-trufflehog
├── audit             (pnpm audit --audit-level=high)
├── sonarcloud        (análise estática + coverage)
└── commitlint        (apenas em PR — Conventional Commits)

```

Workflows adicionais (não bloqueantes):

- `dependency-review.yml` — bloqueia PRs com CVEs ≥ high em novas deps
- `auto-merge.yml` — squash-merge automático de PRs Dependabot (patch/minor)

> **SonarCloud:** operar exclusivamente em modo CI scanner (Automatic Analysis desabilitado no painel do projeto).

---

## Escrevendo testes

### Onde colocar os testes

```
components/Button/
  Button.vue
  Button.spec.ts        ← co-localizado com o componente

composables/
  useBalance.ts
  useBalance.spec.ts    ← co-localizado com o composable

stores/
  portfolio.ts
  portfolio.spec.ts

utils/
  currency.ts
  currency.spec.ts

e2e/
  auth.spec.ts          ← fluxo E2E completo (Playwright)
  dashboard.spec.ts
```

### Testes unitários (Vitest + @nuxt/test-utils)

```typescript
import { describe, it, expect, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import Button from "./Button.vue";

describe("Button", () => {
  it("renders slot content", async () => {
    const wrapper = await mountSuspended(Button, {
      slots: { default: "Confirmar" },
    });
    expect(wrapper.text()).toBe("Confirmar");
  });

  it("emits click event when not disabled", async () => {
    const wrapper = await mountSuspended(Button, {
      props: { disabled: false },
    });
    await wrapper.trigger("click");
    expect(wrapper.emitted("click")).toHaveLength(1);
  });

  it("does not emit click when disabled", async () => {
    const wrapper = await mountSuspended(Button, { props: { disabled: true } });
    await wrapper.trigger("click");
    expect(wrapper.emitted("click")).toBeUndefined();
  });
});
```

### Testes E2E (Playwright)

```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Autenticação", () => {
  test("usuário faz login com credenciais válidas", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("user@auraxis.com");
    await page.getByLabel("Senha").fill("secret123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("exibe erro com credenciais inválidas", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByLabel("Senha").fill("wrongpass");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });
});
```

### O que deve ter teste

| O que                              | Obrigatório | Tipo                        |
| :--------------------------------- | :---------: | :-------------------------- |
| Composables com lógica             |     ✅      | Unitário (Vitest)           |
| Stores Pinia                       |     ✅      | Unitário (Vitest)           |
| Utilitários (`utils/`)             |     ✅      | Unitário (Vitest)           |
| Componentes com lógica             |     ✅      | Unitário (Vitest)           |
| Serviços HTTP                      |     ✅      | Unitário (mock de `$fetch`) |
| Fluxos críticos (login, pagamento) |     ✅      | E2E (Playwright)            |
| Páginas estáticas de apresentação  |     ⚠️      | Opcional                    |
| Estilos visuais                    |     ❌      | Não testar com Vitest       |

---

## Segurança

- **Nunca** expor tokens ou chaves de API no client-side
- **Nunca** usar `localStorage` para dados sensíveis — usar cookies `httpOnly`
- Variáveis de servidor em `NUXT_` (não `NUXT_PUBLIC_`)
- CORS configurado pelo lado da API — não replicar no client
- **Nunca** commitar `.env`, `.env.local`, `.env.production`
- Secret scan automático via Gitleaks + TruffleHog no CI (bloqueia PR)
- CVEs em novas deps bloqueados pelo Dependency Review Action

---

## Definição de pronto — checklist por PR

```
[ ] pnpm quality-check passou (lint + typecheck + test:coverage)
[ ] Testes escritos para toda lógica nova (composables, stores, utils, componentes)
[ ] Coverage não regrediu abaixo de 85% (lines/functions/statements/branches)
[ ] Nenhum `any` implícito ou `@ts-ignore` sem comentário explicativo
[ ] Nenhum secret hardcoded (Gitleaks + TruffleHog verificam automaticamente)
[ ] Mensagem de commit em Conventional Commits (commitlint valida)
[ ] PR com título claro e descrição do que muda e por quê
[ ] CI verde (todos os 12 jobs passando)
```

---

## Referências

- Governança global: `auraxis-platform/.context/07_steering_global.md`
- Contrato de agente: `auraxis-platform/.context/08_agent_contract.md`
- Playbook de qualidade: `auraxis-platform/.context/25_quality_security_playbook.md`
- Definição de pronto: `auraxis-platform/.context/23_definition_of_done.md`
- Quality gates detalhados: `.context/quality_gates.md`
- Workflow de sessão: `auraxis-platform/workflows/agent-session.md`
