# Frontend Guide — auraxis-web

Este guia agora é deliberadamente curto.

## Fontes canônicas

- Arquitetura frontend transversal: `/Users/italochagas/Desktop/projetos/auraxis-platform/.context/26_frontend_architecture.md`
- Steering local do Web: `/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-web/steering.md`
- Quality gates locais: `/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-web/.context/quality_gates.md`
- Produto Web: `/Users/italochagas/Desktop/projetos/auraxis-platform/repos/auraxis-web/product.md`
- Backlog: GitHub Projects / issues do repositório

## Regras práticas

## Regras práticas (resumo)

- construir por feature
- usar DTO + mapper para contratos
- não esconder erro real com placeholder nominal
- preservar experiência resiliente de sessão/auth
- manter Storybook como base do design system quando começarmos a expandi-lo

---

## Índice detalhado

1. [Estrutura de diretórios](#1-estrutura-de-diretórios)
2. [TypeScript](#2-typescript)
3. [Componentes Vue](#3-componentes-vue)
4. [Composables](#4-composables)
5. [Pinia Stores](#5-pinia-stores)
6. [Serviços HTTP](#6-serviços-http)
7. [Páginas e Roteamento](#7-páginas-e-roteamento)
8. [Layouts](#8-layouts)
9. [Estilização](#9-estilização)
10. [Testes](#10-testes)
11. [Performance](#11-performance)
12. [Segurança](#12-segurança)
13. [Quality Gates](#13-quality-gates)
14. [Erros comuns e como evitar](#14-erros-comuns-e-como-evitar)

---

## 1. Estrutura de diretórios

```
auraxis-web/
  pages/            # Rotas — Nuxt file-based routing
  components/       # Componentes Vue reutilizáveis
    base/           # Primitivos: Button, Input, Card, Badge, etc.
    domain/         # Componentes de negócio: TransactionItem, GoalCard, etc.
    layout/         # AppHeader, AppSidebar, AppFooter
  composables/      # Lógica reativa compartilhada
  stores/           # Pinia stores (um por domínio)
  services/         # Clientes HTTP (um por domínio de API)
  types/            # Interfaces e tipos TypeScript
    api/            # Tipos de resposta/request da auraxis-api
    domain/         # Tipos de domínio (Transaction, Goal, User, etc.)
  layouts/          # Layouts Nuxt (default, auth, empty)
  middleware/       # Route middleware (ex: auth guard)
  plugins/          # Plugins Nuxt (ex: inicialização de store)
  assets/
    styles/         # CSS global, variáveis, reset
  public/           # Estáticos públicos (favicon, etc.)
  server/           # API routes server-side (se necessário)
  nuxt.config.ts
  tsconfig.json
  vitest.config.ts
```

---

## 2. TypeScript

### Regra absoluta: sem `any`

```typescript
// ❌ PROIBIDO
const data: any = response.data;
function process(input: any) {}

// ✅ CORRETO
const data: Transaction[] = response.data;
function process(input: CreateTransactionDto) {}
```

### Tipos explícitos em todos os retornos de função

```typescript
// ❌ Retorno inferido em função pública
export function getTotal(transactions: Transaction[]) {
  return transactions.reduce((acc, t) => acc + t.amount, 0);
}

// ✅ Retorno explícito
export function getTotal(transactions: Transaction[]): number {
  return transactions.reduce((acc, t) => acc + t.amount, 0);
}
```

### Nunca usar `as` para forçar tipo — refine os dados

```typescript
// ❌ Type assertion perigosa
const user = response as User;

// ✅ Validar e tipar na fronteira
function parseUser(raw: unknown): User {
  if (!isUser(raw)) throw new Error("Invalid user payload");
  return raw;
}
```

### Tipos de API ficam em `types/api/`

```typescript
// types/api/transaction.ts
export interface CreateTransactionRequest {
  description: string;
  amount: number;
  category_id: string;
  date: string; // ISO 8601
  type: "income" | "expense";
}

export interface TransactionResponse {
  id: string;
  description: string;
  amount: number;
  category: CategoryResponse;
  date: string;
  type: "income" | "expense";
  created_at: string;
}
```

### Tipos de domínio ficam em `types/domain/`

```typescript
// types/domain/transaction.ts — representação interna (pode diferir da API)
export interface Transaction {
  id: string;
  description: string;
  amount: number; // em centavos internamente
  category: Category;
  date: Date; // Date real, não string
  type: TransactionType;
}

export type TransactionType = "income" | "expense";
```

---

## 3. Componentes Vue

### Template `<script setup lang="ts">` obrigatório

```vue
<!-- ❌ Options API não usar -->
<script>
export default {
  data() {
    return {};
  },
};
</script>

<!-- ✅ Composition API com script setup -->
<script setup lang="ts">
import type { Transaction } from "@/types/domain/transaction";

interface Props {
  transaction: Transaction;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
});

const emit = defineEmits<{
  select: [transaction: Transaction];
  delete: [id: string];
}>();
</script>
```

### Props tipadas com interface separada

```typescript
// ✅ Interface explícita, nunca objeto inline
interface Props {
  amount: number;
  currency?: string;
  variant?: "positive" | "negative" | "neutral";
}
```

### Componentes base em `components/base/`

Primitivos que não carregam lógica de negócio:

```vue
<!-- components/base/BaseButton.vue -->
<script setup lang="ts">
interface Props {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
  loading: false,
  disabled: false,
});

defineEmits<{ click: [event: MouseEvent] }>();
</script>
```

### Componentes de domínio em `components/domain/`

```vue
<!-- components/domain/TransactionItem.vue -->
<!-- Conhece Transaction, mas não faz chamadas HTTP -->
<script setup lang="ts">
import type { Transaction } from "@/types/domain/transaction";
import { formatCurrency, formatDate } from "@/utils/formatters";

defineProps<{ transaction: Transaction }>();
defineEmits<{ delete: [id: string] }>();
</script>
```

### Regras de componentes

| Regra                                | Detalhe                                                |
| :----------------------------------- | :----------------------------------------------------- |
| Um componente = uma responsabilidade | Componente que faz fetch + renderiza = separar em dois |
| Sem chamadas HTTP em componentes     | Usar composables ou stores                             |
| Props são somente leitura            | Nunca mutar props diretamente                          |
| Emit para comunicação para cima      | Nunca chamar método do pai via ref                     |
| Nomes em PascalCase                  | `TransactionItem.vue`, não `transaction-item.vue`      |
| `key` em todo `v-for`                | Sempre com id único, nunca index                       |

```vue
<!-- ❌ index como key -->
<TransactionItem v-for="(t, i) in transactions" :key="i" />

<!-- ✅ id como key -->
<TransactionItem v-for="t in transactions" :key="t.id" />
```

---

## 4. Composables

### Um composable = uma preocupação

```typescript
// composables/useTransactions.ts
export function useTransactions() {
  const store = useTransactionStore();
  const { notify } = useNotifications();

  async function createTransaction(dto: CreateTransactionDto): Promise<void> {
    try {
      await store.create(dto);
      notify({ type: "success", message: "Transação criada" });
    } catch (error) {
      notify({ type: "error", message: "Falha ao criar transação" });
      throw error;
    }
  }

  return {
    transactions: computed(() => store.items),
    isLoading: computed(() => store.isLoading),
    createTransaction,
  };
}
```

### Composables nunca retornam estado bruto — usam `computed`

```typescript
// ❌ Retorna ref direto — mutável externamente
return { items: store.items };

// ✅ computed — somente leitura
return { items: computed(() => store.items) };
```

### Prefixo `use` obrigatório

```
useTransactions.ts  ✅
transactions.ts     ❌
getTransactions.ts  ❌
```

---

## 5. Pinia Stores

### Estrutura de store (Composition API style)

```typescript
// stores/transaction.ts
import { defineStore } from "pinia";
import { transactionService } from "@/services/transaction.service";
import type { Transaction } from "@/types/domain/transaction";
import type { CreateTransactionDto } from "@/types/api/transaction";

export const useTransactionStore = defineStore("transaction", () => {
  // State
  const items = ref<Transaction[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const total = computed(() =>
    items.value.reduce((acc, t) => (t.type === "income" ? acc + t.amount : acc - t.amount), 0),
  );

  const byCategory = computed(() =>
    items.value.reduce<Record<string, Transaction[]>>((acc, t) => {
      (acc[t.category.id] ??= []).push(t);
      return acc;
    }, {}),
  );

  // Actions
  async function fetchAll(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      items.value = await transactionService.getAll();
    } catch (err) {
      error.value = "Falha ao carregar transações";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function create(dto: CreateTransactionDto): Promise<Transaction> {
    const created = await transactionService.create(dto);
    items.value.unshift(created);
    return created;
  }

  async function remove(id: string): Promise<void> {
    await transactionService.delete(id);
    items.value = items.value.filter((t) => t.id !== id);
  }

  function $reset() {
    items.value = [];
    isLoading.value = false;
    error.value = null;
  }

  return {
    items,
    isLoading,
    error,
    total,
    byCategory,
    fetchAll,
    create,
    remove,
    $reset,
  };
});
```

### Regras de stores

| Regra                                     | Detalhe                                               |
| :---------------------------------------- | :---------------------------------------------------- |
| Um store por domínio                      | `useTransactionStore`, `useGoalStore`, `useAuthStore` |
| Nunca chamar store em outro store         | Usar composables para orquestrar                      |
| `$reset()` sempre presente                | Para logout e cleanup                                 |
| Actions lançam erros — componentes tratam | Store não swallows exceptions                         |
| Sem lógica de apresentação                | Formatação fica em utils/composables                  |

---

## 6. Serviços HTTP

### Um service por domínio

```typescript
// services/transaction.service.ts
import type { Transaction } from "@/types/domain/transaction";
import type { CreateTransactionRequest, TransactionResponse } from "@/types/api/transaction";

function toTransaction(raw: TransactionResponse): Transaction {
  return {
    id: raw.id,
    description: raw.description,
    amount: raw.amount,
    category: raw.category,
    date: new Date(raw.date),
    type: raw.type,
  };
}

export const transactionService = {
  async getAll(): Promise<Transaction[]> {
    const data = await $fetch<TransactionResponse[]>("/api/v1/transactions");
    return data.map(toTransaction);
  },

  async getById(id: string): Promise<Transaction> {
    const data = await $fetch<TransactionResponse>(`/api/v1/transactions/${id}`);
    return toTransaction(data);
  },

  async create(dto: CreateTransactionRequest): Promise<Transaction> {
    const data = await $fetch<TransactionResponse>("/api/v1/transactions", {
      method: "POST",
      body: dto,
    });
    return toTransaction(data);
  },

  async delete(id: string): Promise<void> {
    await $fetch(`/api/v1/transactions/${id}`, { method: "DELETE" });
  },
};
```

### Regras de services

| Regra                                 | Detalhe                                         |
| :------------------------------------ | :---------------------------------------------- |
| Transformam dados da API para domínio | Função `toX(raw: XResponse): X` sempre presente |
| Nunca retornam o tipo raw da API      | Páginas/stores lidam com tipos de domínio       |
| Erros HTTP sobem sem wrap             | Store e composable tratam                       |
| `$fetch` nativo do Nuxt               | Não instalar axios salvo necessidade comprovada |
| Base URL via `nuxt.config.ts`         | Nunca hardcoded                                 |

### Configuração de base URL

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    apiBaseUrl: process.env.NUXT_API_BASE_URL, // server-side
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL, // client-side
    },
  },
});
```

---

## 7. Páginas e Roteamento

### Estrutura de rotas

```
pages/
  index.vue              → /
  auth/
    login.vue            → /auth/login
    register.vue         → /auth/register
  dashboard/
    index.vue            → /dashboard
    transactions/
      index.vue          → /dashboard/transactions
      [id].vue           → /dashboard/transactions/:id
  goals/
    index.vue            → /goals
    [id].vue             → /goals/:id
```

### Middleware de autenticação

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();

  if (!auth.isAuthenticated && to.path !== "/auth/login") {
    return navigateTo("/auth/login");
  }
});
```

```vue
<!-- pages/dashboard/index.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: "auth",
  layout: "dashboard",
});
</script>
```

### Páginas são thin — sem lógica de negócio

```vue
<!-- ✅ Página thin — orquestra, não processa -->
<script setup lang="ts">
definePageMeta({ middleware: "auth", layout: "dashboard" });

const { transactions, isLoading, createTransaction } = useTransactions();
await useAsyncData("transactions", () => useTransactionStore().fetchAll());
</script>

<template>
  <div>
    <TransactionList :transactions="transactions" :loading="isLoading" />
  </div>
</template>
```

---

## 8. Layouts

```
layouts/
  default.vue      # Layout público (landing, auth)
  dashboard.vue    # Layout autenticado (sidebar, header, nav)
  empty.vue        # Sem estrutura (error pages, fullscreen)
```

---

## 9. Estilização

### CSS scoped em componentes, variáveis globais em `assets/styles/`

```vue
<style scoped>
.transaction-item {
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
}

.transaction-item--positive {
  color: var(--color-success);
}
</style>
```

```css
/* assets/styles/variables.css */
:root {
  --color-primary: #5c6bc0;
  --color-success: #43a047;
  --color-danger: #e53935;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --radius-sm: 4px;
  --radius-md: 8px;
}
```

### Regras de estilo

| Regra                                  | Detalhe                                        |
| :------------------------------------- | :--------------------------------------------- |
| Sem `style` global em componentes      | Apenas `scoped`                                |
| Sem valores mágicos                    | Usar variáveis CSS do design system            |
| Sem `!important`                       | Se precisar, o componente está mal estruturado |
| Classes utilitárias apenas via sistema | Não misturar Tailwind ad-hoc com CSS modules   |

---

## 10. Testes

### Vitest + Vue Test Utils

```typescript
// components/domain/__tests__/TransactionItem.spec.ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import TransactionItem from "../TransactionItem.vue";
import { mockTransaction } from "@/tests/factories/transaction.factory";

describe("TransactionItem", () => {
  it("exibe descrição e valor formatado", () => {
    const transaction = mockTransaction({ amount: 5000, type: "expense" });
    const wrapper = mount(TransactionItem, { props: { transaction } });

    expect(wrapper.text()).toContain(transaction.description);
    expect(wrapper.text()).toContain("R$ 50,00");
  });

  it("emite evento delete com id correto", async () => {
    const transaction = mockTransaction();
    const wrapper = mount(TransactionItem, { props: { transaction } });

    await wrapper.find('[data-testid="delete-btn"]').trigger("click");
    expect(wrapper.emitted("delete")?.[0]).toEqual([transaction.id]);
  });
});
```

### Factories para dados de teste

```typescript
// tests/factories/transaction.factory.ts
import type { Transaction } from "@/types/domain/transaction";

export function mockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn-001",
    description: "Supermercado",
    amount: 15000,
    category: { id: "cat-001", name: "Alimentação" },
    date: new Date("2026-02-01"),
    type: "expense",
    ...overrides,
  };
}
```

### Regras de testes

| Regra                                     | Detalhe                                                                        |
| :---------------------------------------- | :----------------------------------------------------------------------------- |
| Testar comportamento, não implementação   | `expect(wrapper.text()).toContain(...)` não `expect(wrapper.vm.internalState)` |
| `data-testid` para elementos de interação | Não selecionar por classe CSS                                                  |
| Factories para todos os tipos de domínio  | Sem objetos literais inline nos testes                                         |
| Mocks de services, não de stores          | Store pode ser testada com estado real                                         |
| Sem `setTimeout` em testes                | Usar `await nextTick()` ou `flushPromises()`                                   |

---

## 11. Performance

### `useAsyncData` para SSR — nunca `onMounted` + fetch

```vue
<script setup lang="ts">
// ❌ Fetch no cliente — sem SSR, sem cache
onMounted(async () => {
  transactions.value = await transactionService.getAll();
});

// ✅ SSR-aware com cache automático
const { data: transactions } = await useAsyncData("transactions", () =>
  transactionService.getAll(),
);
</script>
```

### Lazy loading de componentes pesados

```typescript
// Componentes com gráficos, editores, tabelas grandes
const HeavyChart = defineAsyncComponent(() => import("@/components/domain/HeavyChart.vue"));
```

### `v-memo` para listas estáticas longas

```vue
<TransactionItem
  v-for="t in transactions"
  :key="t.id"
  v-memo="[t.id, t.amount, t.description]"
  :transaction="t"
/>
```

### Regras de performance

| Regra                                       | Detalhe                                                      |
| :------------------------------------------ | :----------------------------------------------------------- |
| Paginação em listas > 50 itens              | Nunca carregar tudo de uma vez                               |
| Imagens com `<UiImage>`                     | Lazy load, decoding async e dimensões explícitas (evita CLS) |
| Não computar em template                    | Mover para `computed` ou `useMemo`                           |
| `shallowRef` para objetos grandes imutáveis | Evita reatividade profunda desnecessária                     |
| Sem watchers em loop                        | `watch` com `immediate: false` e deep mínimo                 |

---

## 12. Segurança

### Tokens JWT em `httpOnly` cookies — nunca em `localStorage`

```typescript
// ❌ Token visível para JS — vulnerável a XSS
localStorage.setItem("token", accessToken);

// ✅ Cookie httpOnly — inacessível para JS
// O servidor seta via Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict
```

### Sanitização de dados antes de exibir

```vue
<!-- ❌ v-html com dado de usuário — XSS garantido -->
<div v-html="userContent" />

<!-- ✅ texto puro — sem risco -->
<p>{{ userContent }}</p>
```

### Variáveis de ambiente

```
NUXT_API_BASE_URL=...       → server-side apenas (nunca exposto ao cliente)
NUXT_PUBLIC_API_BASE_URL=...→ safe para expor ao cliente
```

### Regras de segurança

| Regra                            | Detalhe                              |
| :------------------------------- | :----------------------------------- |
| Nunca `v-html` com dado externo  | Use `:textContent` ou `{{ }}`        |
| Nunca tokens em `localStorage`   | httpOnly cookies                     |
| Nunca secrets em `NUXT_PUBLIC_*` | Usar `NUXT_*` sem PUBLIC             |
| Nunca `.env` commitado           | Verificar `.gitignore` antes de push |
| CORS gerenciado pela API         | Não replicar no front                |

---

## 13. Quality Gates

Execute antes de **todo commit**, nesta ordem:

```bash
# 1. Lint (@nuxt/eslint)
pnpm lint

# 2. Type-check
pnpm typecheck

# 3. Testes
pnpm test

# Combinado:
pnpm quality-check
```

**Falha em qualquer gate = não commitar.**

Para referência completa dos thresholds e CI: `.context/quality_gates.md`

---

## 14. Erros comuns e como evitar

| Erro                                       | Causa                                        | Solução                                                     |
| :----------------------------------------- | :------------------------------------------- | :---------------------------------------------------------- |
| `Cannot read property of undefined` em SSR | Store vazia no server render                 | Inicializar com `null` ou usar `?` opcional + loading state |
| Hydration mismatch                         | Dado diferente no server vs. cliente         | Usar `useAsyncData` em vez de `onMounted`                   |
| Store não persiste entre páginas           | Store criada localmente no componente        | Criar store no nível correto do Nuxt                        |
| `ref` não reativo em template              | `ref` usado sem `.value` no `<script>`       | Lembrar: `.value` em `<script>`, automático em `<template>` |
| Circular dependency de stores              | Store A usa Store B que usa Store A          | Extrair lógica compartilhada para composable                |
| Props mutadas diretamente                  | `props.item.value = x`                       | Emitir evento e deixar o pai atualizar                      |
| `any` silencioso                           | `tsconfig` sem `strict`                      | Confirmar `"strict": true` no tsconfig                      |
| Fetch duplicado                            | `useFetch` + `useAsyncData` para mesma chave | Usar chave consistente ou centralizar no store              |

---

## Referências

- Governança: `auraxis-platform/.context/07_steering_global.md`
- Contrato de agente: `../CLAUDE.md`
- Quality gates: `.context/quality_gates.md`
- Fonte de execução: GitHub Projects / issue correspondente
