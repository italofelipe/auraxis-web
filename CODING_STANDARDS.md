# Coding Standards — auraxis-web

Stack: **Nuxt 4 · TypeScript strict · @nuxt/eslint · Prettier · Vitest · Pinia**

Este documento define **o único jeito certo de escrever código neste projeto**.
Não é um guia de boas práticas — é um contrato técnico vinculante.
Qualquer código que viole estas regras **não passa nos gates e não é mergeado**.

---

## 1. Princípios fundamentais

| Princípio                     | O que significa na prática                                                           |
| :---------------------------- | :----------------------------------------------------------------------------------- |
| **Explícito > implícito**     | Tipos, retornos e intenções sempre declarados                                        |
| **Sem magia**                 | Nenhum comportamento que não esteja documentado e rastreável                         |
| **Uma responsabilidade**      | Função faz uma coisa. Componente renderiza uma coisa. Hook gerencia uma preocupação. |
| **Falha cedo e ruidosamente** | Erros devem estourar imediatamente, não ser silenciados                              |
| **Sem estado oculto**         | Todo estado é explícito, derivado ou documentado                                     |
| **Código é comunicação**      | Nomes e estrutura devem revelar intenção sem comentário                              |

---

## 2. TypeScript

### 2.1 `strict: true` — sem exceções

O `tsconfig.json` mantém `"strict": true`. Isso ativa:

- `noImplicitAny` — sem inferência de `any`
- `strictNullChecks` — `null` e `undefined` são tipos distintos
- `strictFunctionTypes` — checagem de parâmetros de funções
- `noImplicitThis` — `this` deve ser tipado
- `strictPropertyInitialization` — propriedades de classe devem ser inicializadas

### 2.2 Proibições absolutas

```typescript
// ❌ any em qualquer forma
const data: any = response
function process(x: any) {}
as any

// ❌ type assertion perigosa
const user = response as User            // sem validação

// ❌ non-null assertion sem justificativa documentada
const el = document.getElementById('x')! // pode ser null

// ❌ @ts-ignore
// @ts-ignore — nunca
const x = wrongType

// ❌ @ts-expect-error em código de produção
// @ts-expect-error — apenas em testes com comentário explicativo
```

### 2.3 Retornos explícitos em funções públicas

```typescript
// ❌ Retorno inferido em função exportada
export function calculateBalance(items: Transaction[]) {
  return items.reduce(...)
}

// ✅ Retorno explícito
export function calculateBalance(items: Transaction[]): number {
  return items.reduce(...)
}

// ✅ Exceção aceita: arrow functions de uma linha, retorno óbvio
const double = (n: number) => n * 2
```

### 2.4 Tipos de API vs. tipos de domínio — sempre separados

```
types/
  api/
    transaction.ts      ← formato bruto da auraxis-api (snake_case, strings de data)
    goal.ts
    auth.ts
  domain/
    transaction.ts      ← representação interna (camelCase, Date reais, cents)
    goal.ts
    user.ts
```

```typescript
// types/api/transaction.ts
export interface TransactionResponse {
  id: string;
  description: string;
  amount: number; // em centavos
  category_id: string;
  date: string; // ISO 8601 — string crua da API
  type: "income" | "expense";
  created_at: string;
}

export interface CreateTransactionRequest {
  description: string;
  amount: number;
  category_id: string;
  date: string; // ISO 8601
  type: "income" | "expense";
}

// types/domain/transaction.ts
export interface Transaction {
  id: string;
  description: string;
  amount: number; // em centavos
  category: Category;
  date: Date; // Date real — nunca string dentro do app
  type: TransactionType;
  createdAt: Date;
}

export type TransactionType = "income" | "expense";
```

### 2.5 Union types em vez de enums

```typescript
// ❌ Enum — gera código JavaScript desnecessário
enum TransactionType {
  Income = "income",
  Expense = "expense",
}

// ✅ Union type — sem overhead, comparável diretamente
type TransactionType = "income" | "expense";

// ✅ Const object quando precisa de iteração
const TRANSACTION_TYPES = ["income", "expense"] as const;
type TransactionType = (typeof TRANSACTION_TYPES)[number];
```

### 2.6 Generics quando o tipo varia, não como atalho

```typescript
// ❌ Generic desnecessário — o tipo é sempre o mesmo
function getFirst<T>(arr: T[]): T {
  return arr[0];
}

// ✅ Generic justificado — tipo realmente varia
async function fetchFromApi<TResponse>(path: string): Promise<TResponse> {
  return $fetch<TResponse>(path);
}
```

---

## 3. Componentes Vue

### 3.1 Template obrigatório

```vue
<script setup lang="ts">
// 1. imports de tipos (type-only)
import type { Transaction } from "@/types/domain/transaction";

// 2. imports de composables e utils
import { formatCurrency } from "@/utils/formatters";
import { useTransactions } from "@/composables/useTransactions";

// 3. props
interface Props {
  transaction: Transaction;
  compact?: boolean;
}
const props = withDefaults(defineProps<Props>(), { compact: false });

// 4. emits
const emit = defineEmits<{
  select: [transaction: Transaction];
  delete: [id: string];
}>();

// 5. composables
const { remove } = useTransactions();

// 6. estado local
const isDeleting = ref(false);

// 7. computed
const amountColor = computed(() =>
  props.transaction.type === "expense" ? "text-danger" : "text-success",
);

// 8. handlers
async function handleDelete() {
  isDeleting.value = true;
  try {
    await remove(props.transaction.id);
    emit("delete", props.transaction.id);
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <!-- markup -->
</template>

<style scoped>
/* estilos */
</style>
```

### 3.2 Props — interface separada, `withDefaults` para opcionais

```typescript
// ❌ Objeto inline
defineProps({ transaction: Object, compact: Boolean });

// ❌ Interface sem withDefaults para opcionais
const props = defineProps<{ transaction: Transaction; compact?: boolean }>();
// → props.compact pode ser undefined, causando erros

// ✅ Interface + withDefaults
interface Props {
  transaction: Transaction;
  compact?: boolean;
  variant?: "default" | "minimal";
}
const props = withDefaults(defineProps<Props>(), {
  compact: false,
  variant: "default",
});
```

### 3.3 Emits — tipados com sintaxe de tupla

```typescript
// ❌ Sem tipos
defineEmits(["select", "delete"]);

// ✅ Tipado
const emit = defineEmits<{
  select: [transaction: Transaction]; // tupla dos argumentos
  delete: [id: string];
  update: [field: keyof Transaction, value: unknown];
}>();
```

### 3.4 `v-for` — `key` com id, nunca index

```vue
<!-- ❌ index como key — causa bugs em re-ordenação e animações -->
<TransactionItem v-for="(t, i) in transactions" :key="i" :transaction="t" />

<!-- ✅ id estável como key -->
<TransactionItem v-for="t in transactions" :key="t.id" :transaction="t" />
```

### 3.5 Componentes nunca fazem fetch

```vue
<!-- ❌ Fetch diretamente em componente -->
<script setup lang="ts">
const transactions = ref<Transaction[]>([]);
onMounted(async () => {
  transactions.value = await $fetch("/api/transactions");
});
</script>

<!-- ✅ Composable gerencia o fetch -->
<script setup lang="ts">
const { transactions, isLoading } = useTransactions();
await useAsyncData("transactions", () => useTransactionStore().fetchAll());
</script>
```

### 3.6 Sem acesso direto a store em template

```vue
<!-- ❌ Store exposta diretamente no template -->
<script setup lang="ts">
const store = useTransactionStore();
</script>
<template>
  <div>{{ store.items.length }}</div>
</template>

<!-- ✅ computed que expõe apenas o necessário -->
<script setup lang="ts">
const { transactions, total } = useTransactions();
</script>
<template>
  <div>{{ transactions.length }}</div>
</template>
```

### 3.7 Nomes e convenções

| Item                   | Convenção                 | Exemplo                                     |
| :--------------------- | :------------------------ | :------------------------------------------ |
| Arquivo de componente  | PascalCase + `.vue`       | `TransactionItem.vue`                       |
| Componentes base       | Prefixo `Base`            | `BaseButton.vue`, `BaseInput.vue`           |
| Componentes de domínio | Nome do domínio           | `TransactionList.vue`, `GoalCard.vue`       |
| Componentes de layout  | Prefixo `App` ou `Layout` | `AppHeader.vue`, `LayoutDashboard.vue`      |
| Props booleanas        | Sem valor = true          | `<Component disabled />` = `disabled: true` |

---

## 4. Composables

### 4.1 Regras fundamentais

```typescript
// 1. Prefixo 'use' obrigatório
export function useTransactions() {} // ✅
export function transactions() {} // ❌
export function getTransactions() {} // ❌

// 2. Retornar objeto nomeado, nunca array (exceto useState-like)
return { items, isLoading, create, remove }; // ✅
return [items, create]; // ❌ (exceto padrão [state, setter])

// 3. Estado readonly externamente — expor via computed
return {
  items: computed(() => store.items), // ✅ readonly
  items: store.items, // ❌ mutável externamente
};

// 4. Erros sempre sobem — composable não swallows
async function create(dto: CreateTransactionDto) {
  // ❌ Silencia o erro
  try {
    await store.create(dto);
  } catch {
    /* nada */
  }

  // ✅ Deixa subir — componente/página decide o que mostrar
  await store.create(dto);
}
```

### 4.2 Estrutura padrão

```typescript
// composables/useTransactions.ts
export function useTransactions() {
  const store = useTransactionStore();
  const { notify } = useNotifications();

  // Ações com feedback
  async function create(dto: CreateTransactionDto): Promise<void> {
    await store.create(dto);
    notify({ type: "success", message: "Transação criada" });
  }

  async function remove(id: string): Promise<void> {
    await store.remove(id);
    notify({ type: "success", message: "Transação removida" });
  }

  return {
    transactions: computed(() => store.items),
    isLoading: computed(() => store.isLoading),
    error: computed(() => store.error),
    total: computed(() => store.total),
    create,
    remove,
    refresh: store.fetchAll,
  };
}
```

---

## 5. Pinia Stores

### 5.1 Estrutura canônica (Composition API)

```typescript
// stores/transaction.ts
import { defineStore } from "pinia";
import { transactionService } from "@/services/transaction.service";
import type { Transaction } from "@/types/domain/transaction";
import type { CreateTransactionRequest } from "@/types/api/transaction";

export const useTransactionStore = defineStore("transaction", () => {
  // ── State ──────────────────────────────────────────────────────────
  const items = ref<Transaction[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // ── Getters ────────────────────────────────────────────────────────
  const total = computed((): number =>
    items.value.reduce(
      (acc, t) => (t.type === "income" ? acc + t.amount : acc - t.amount),
      0,
    ),
  );

  const income = computed((): number =>
    items.value
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0),
  );

  const expense = computed((): number =>
    items.value
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0),
  );

  // ── Actions ────────────────────────────────────────────────────────
  async function fetchAll(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      items.value = await transactionService.getAll();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Erro desconhecido";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function create(dto: CreateTransactionRequest): Promise<Transaction> {
    const created = await transactionService.create(dto);
    items.value = [created, ...items.value];
    return created;
  }

  async function update(
    id: string,
    dto: Partial<CreateTransactionRequest>,
  ): Promise<void> {
    const updated = await transactionService.update(id, dto);
    items.value = items.value.map((t) => (t.id === id ? updated : t));
  }

  async function remove(id: string): Promise<void> {
    await transactionService.delete(id);
    items.value = items.value.filter((t) => t.id !== id);
  }

  // ── Reset ──────────────────────────────────────────────────────────
  function $reset(): void {
    items.value = [];
    isLoading.value = false;
    error.value = null;
  }

  return {
    // state (readonly via computed quando possível)
    items: computed(() => items.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    // getters
    total,
    income,
    expense,
    // actions
    fetchAll,
    create,
    update,
    remove,
    $reset,
  };
});
```

### 5.2 Regras de store

| Regra                                | Por quê                                      |
| :----------------------------------- | :------------------------------------------- |
| Um store por domínio de negócio      | Acoplamento zero entre domínios              |
| `$reset()` obrigatório               | Logout precisa limpar tudo                   |
| Actions lançam erros — não swallowam | Store não decide o que mostrar ao usuário    |
| Getters nunca chamam actions         | Sem side effects em leitura                  |
| Sem lógica de apresentação           | Formatação fica em `utils/`, não em store    |
| Sem chamadas a outros stores         | Usar composable para orquestrar entre stores |

---

## 6. Services HTTP

### 6.1 Estrutura obrigatória

Cada service tem três responsabilidades: chamar a API, mapear tipos raw → domínio, expor métodos nomeados.

```typescript
// services/transaction.service.ts
import type { Transaction } from "@/types/domain/transaction";
import type {
  TransactionResponse,
  CreateTransactionRequest,
} from "@/types/api/transaction";

// ── Mapper ─────────────────────────────────────────────────────────────
// Toda transformação API → domínio passa aqui.
// Nunca retornar TransactionResponse para fora deste arquivo.
function toTransaction(raw: TransactionResponse): Transaction {
  return {
    id: raw.id,
    description: raw.description,
    amount: raw.amount,
    category: { id: raw.category_id, name: "" },
    date: new Date(raw.date),
    type: raw.type,
    createdAt: new Date(raw.created_at),
  };
}

// ── Service ────────────────────────────────────────────────────────────
export const transactionService = {
  async getAll(): Promise<Transaction[]> {
    const data = await $fetch<TransactionResponse[]>("/api/v1/transactions");
    return data.map(toTransaction);
  },

  async getById(id: string): Promise<Transaction> {
    const data = await $fetch<TransactionResponse>(
      `/api/v1/transactions/${id}`,
    );
    return toTransaction(data);
  },

  async create(dto: CreateTransactionRequest): Promise<Transaction> {
    const data = await $fetch<TransactionResponse>("/api/v1/transactions", {
      method: "POST",
      body: dto,
    });
    return toTransaction(data);
  },

  async update(
    id: string,
    dto: Partial<CreateTransactionRequest>,
  ): Promise<Transaction> {
    const data = await $fetch<TransactionResponse>(
      `/api/v1/transactions/${id}`,
      {
        method: "PATCH",
        body: dto,
      },
    );
    return toTransaction(data);
  },

  async delete(id: string): Promise<void> {
    await $fetch(`/api/v1/transactions/${id}`, { method: "DELETE" });
  },
};
```

### 6.2 Regras de service

| Regra                             | Detalhe                                    |
| :-------------------------------- | :----------------------------------------- |
| Retornar apenas tipos de domínio  | `TransactionResponse` nunca sai do service |
| Mapper `toX()` sempre presente    | Isola transformação de dados               |
| Sem tratamento de erro no service | Erros HTTP sobem para store/composable     |
| Sem lógica de apresentação        | Sem `console.log`, sem toast               |
| Base URL via config Nuxt          | `nuxt.config.ts` → `runtimeConfig`         |
| Sem estado global no service      | Service é stateless                        |

---

## 7. Páginas

### 7.1 Páginas são thin — orquestram, não processam

```vue
<!-- ❌ Página com lógica de negócio -->
<script setup lang="ts">
const transactions = ref<Transaction[]>([]);
const total = computed(() =>
  transactions.value.reduce((acc, t) => acc + t.amount, 0),
);
onMounted(async () => {
  const data = await $fetch("/api/v1/transactions");
  transactions.value = data.map(/* transform */);
});
</script>

<!-- ✅ Página thin — delega para composable -->
<script setup lang="ts">
definePageMeta({ middleware: "auth", layout: "dashboard" });

const { transactions, isLoading, total } = useTransactions();
await useAsyncData("transactions", () => useTransactionStore().fetchAll());
</script>

<template>
  <DashboardLayout>
    <TransactionList :transactions="transactions" :loading="isLoading" />
    <BalanceSummary :total="total" />
  </DashboardLayout>
</template>
```

### 7.2 `definePageMeta` obrigatório em páginas protegidas

```typescript
definePageMeta({
  middleware: "auth", // obrigatório em rotas autenticadas
  layout: "dashboard", // layout explícito — sem inferência
});
```

### 7.3 `useAsyncData` para fetch SSR — nunca `onMounted`

```typescript
// ❌ Client-side only — sem SSR, re-fetch no hidrate
onMounted(async () => {
  await store.fetchAll();
});

// ✅ SSR-aware — roda no servidor e no cliente, com deduplicação
const { error } = await useAsyncData("transactions", () => store.fetchAll());

if (error.value) {
  throw createError({
    statusCode: 500,
    message: "Falha ao carregar transações",
  });
}
```

---

## 8. Utilitários e formatadores

### 8.1 Formatadores em `utils/formatters.ts`

```typescript
// utils/formatters.ts

export function formatCurrency(
  amount: number,
  currency = "BRL",
  locale = "pt-BR",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100); // centavos → reais
}

export function formatDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
  locale = "pt-BR",
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
```

### 8.2 Sem lógica em template — computed ou utils

```vue
<!-- ❌ Formatação no template -->
<template>
  <span>{{ (transaction.amount / 100).toFixed(2).replace(".", ",") }}</span>
</template>

<!-- ✅ Formatar via util -->
<script setup lang="ts">
import { formatCurrency } from "@/utils/formatters";
const displayAmount = computed(() => formatCurrency(props.transaction.amount));
</script>
<template>
  <span>{{ displayAmount }}</span>
</template>
```

---

## 9. Estilização

### 9.1 CSS scoped + variáveis CSS — sem valores mágicos

```vue
<style scoped>
.transaction-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  gap: var(--spacing-sm);
}

.transaction-item__amount--positive {
  color: var(--color-success);
}
.transaction-item__amount--negative {
  color: var(--color-danger);
}
</style>
```

```css
/* assets/styles/variables.css */
:root {
  /* Colors */
  --color-primary: #5c6bc0;
  --color-primary-light: #8e99f3;
  --color-success: #43a047;
  --color-danger: #e53935;
  --color-warning: #fb8c00;
  --color-surface: #ffffff;
  --color-background: #f5f5f5;
  --color-text: #212121;
  --color-text-muted: #757575;
  --color-border: #e0e0e0;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* Shadow */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.12);
}
```

### 9.2 Proibições de estilo

| Proibição                      | Motivo                                         |
| :----------------------------- | :--------------------------------------------- |
| `!important`                   | Sempre existe solução melhor                   |
| Valores numéricos sem variável | `padding: 16px` → `padding: var(--spacing-md)` |
| `style` inline para layout     | Apenas para valores dinâmicos calculados       |
| Classes CSS sem BEM ou módulo  | Evitar colisões em componentes grandes         |

---

## 10. Testes

### 10.1 O que testar

| Alvo                               | Ferramenta                | O que verificar                       | Obrigatório |
| :--------------------------------- | :------------------------ | :------------------------------------ | :---------: |
| Composables com lógica             | Vitest                    | Retornos, reatividade, side effects   |     ✅      |
| Stores Pinia                       | Vitest                    | Actions, getters, estado após mutação |     ✅      |
| Utilitários (`utils/`)             | Vitest                    | Input/output determinístico           |     ✅      |
| Componentes com lógica condicional | Vitest + @nuxt/test-utils | Props, eventos, estados visuais       |     ✅      |
| Serviços HTTP                      | Vitest + `vi.mock`        | Mapeamento API → domínio              |     ✅      |
| Fluxos críticos (login, pagamento) | Playwright E2E            | Happy path + erro                     |     ✅      |
| Páginas de apresentação estática   | Vitest                    | Render básico                         | ⚠️ Opcional |
| Estilos visuais                    | —                         | Não testar com Vitest                 |     ❌      |

### 10.2 Estrutura de arquivos

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

### 10.3 Testes unitários — Vitest + @nuxt/test-utils

```typescript
// Button.spec.ts
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

### 10.4 Testando composables

```typescript
// useBalance.spec.ts
import { describe, it, expect, vi } from "vitest";
import { useBalance } from "./useBalance";

describe("useBalance", () => {
  it("returns formatted balance", () => {
    const { formattedBalance } = useBalance({ amount: 15000 });
    expect(formattedBalance.value).toBe("R$ 150,00");
  });
});
```

### 10.5 Testes E2E — Playwright

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
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
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

### 10.6 Factories para dados de teste

```typescript
// tests/factories/transaction.factory.ts
import type { Transaction } from "@/types/domain/transaction";

let _seq = 0;

export function mockTransaction(
  overrides: Partial<Transaction> = {},
): Transaction {
  _seq++;
  return {
    id: `txn-${String(_seq).padStart(4, "0")}`,
    description: "Supermercado",
    amount: 15000,
    category: { id: "cat-001", name: "Alimentação" },
    date: new Date("2026-02-01T12:00:00Z"),
    type: "expense",
    createdAt: new Date("2026-02-01T10:00:00Z"),
    ...overrides,
  };
}
```

### 10.7 Regras de testes

| Regra                                    | Detalhe                                           |
| :--------------------------------------- | :------------------------------------------------ |
| `data-testid` em elementos interativos   | Seletor estável — não usa classes CSS             |
| Factories para todos os tipos            | Sem objeto literal inline nos testes              |
| Testar comportamento, não implementação  | `wrapper.text()` não `wrapper.vm.internalRef`     |
| Mocks apenas de services e deps externas | Store real nos testes de store                    |
| Sem `setTimeout`                         | `await nextTick()` ou `flushPromises()`           |
| Coverage mínimo: 85% lines/functions     | Enforced via `vitest.config.ts#coverageThreshold` |
| E2E para fluxos críticos                 | Playwright cobre login, pagamento, navegação      |

### 10.8 Configuração Vitest

```typescript
// vitest.config.ts
import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    environment: "nuxt",
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
      exclude: [
        "nuxt.config.ts",
        "**/*.d.ts",
        "tests/factories/**",
        "tests/helpers/**",
        "e2e/**",
      ],
    },
  },
});
```

---

## 11. Segurança

### 11.1 Regras não negociáveis

| Regra                            | Implementação                                                            |
| :------------------------------- | :----------------------------------------------------------------------- |
| Tokens JWT em `httpOnly` cookies | `Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict` pelo servidor |
| Sem `v-html` com dado de usuário | Usar `{{ }}` ou `:textContent`                                           |
| Sem secrets em `NUXT_PUBLIC_*`   | `NUXT_*` para server-side only                                           |
| Sem `.env` commitado             | `.gitignore` com `.env*`, exceto `.env.example`                          |
| Validação de input nos forms     | `vee-validate` ou validação manual — nunca confiar apenas no backend     |
| CSP headers configurados         | No `nuxt.config.ts` via `routeRules` ou middleware                       |

### 11.2 Headers de segurança obrigatórios

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    "/**": {
      headers: {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      },
    },
  },
});
```

---

## 12. Performance

### 12.1 Regras obrigatórias

| Regra                                                      | Implementação                           |
| :--------------------------------------------------------- | :-------------------------------------- |
| `useAsyncData` para fetch                                  | Nunca `onMounted` + fetch               |
| `v-memo` em listas estáticas longas                        | Evita re-render desnecessário           |
| Componentes pesados com `defineAsyncComponent`             | Gráficos, editores, tabelas complexas   |
| Paginação em listas > 50 itens                             | `useLazyFetch` com cursor               |
| Imagens com `<NuxtImg>`                                    | Lazy load, WebP automático, placeholder |
| `shallowRef` para objetos grandes sem reatividade profunda | `const config = shallowRef(bigObject)`  |

---

## 13. Nomenclatura — referência rápida

| Item                    | Convenção                         | Exemplo                                   |
| :---------------------- | :-------------------------------- | :---------------------------------------- |
| Arquivo de componente   | `PascalCase.vue`                  | `TransactionItem.vue`                     |
| Arquivo de composable   | `camelCase.ts` prefixado `use`    | `useTransactions.ts`                      |
| Arquivo de store        | `camelCase.ts`                    | `transaction.ts`                          |
| Arquivo de service      | `camelCase.service.ts`            | `transaction.service.ts`                  |
| Arquivo de tipo API     | `camelCase.ts` em `types/api/`    | `transaction.ts`                          |
| Arquivo de tipo domínio | `camelCase.ts` em `types/domain/` | `transaction.ts`                          |
| Arquivo de util         | `camelCase.ts`                    | `formatters.ts`                           |
| Função exportada        | `camelCase`                       | `formatCurrency`                          |
| Interface               | `PascalCase`                      | `Transaction`, `CreateTransactionRequest` |
| Type alias              | `PascalCase`                      | `TransactionType`                         |
| Constante global        | `UPPER_SNAKE_CASE`                | `MAX_RETRY_COUNT`                         |
| Prop booleana           | Substantivo + adjetivo            | `disabled`, `loading`, `compact`          |
| Handler                 | `handle` + ação                   | `handleDelete`, `handleSubmit`            |
| Getter computed         | Substantivo ou `is/has/can`       | `total`, `isLoading`, `hasError`          |
| `data-testid`           | `kebab-case` descritivo           | `btn-delete`, `input-amount`              |

---

---

## 14. Arquitetura feature-based

> Regra central: **features não importam de outras features.**
> Todo compartilhamento passa por `shared/`.

```
src/
  shared/
    components/        ← Button, Input, Card (sem lógica de negócio)
    composables/       ← useDebounce, useMediaQuery (agnósticos de domínio)
    theme/             ← TODOS os tokens de design (ver seção 15)
    types/             ← tipos globais compartilhados
    utils/             ← funções puras agnósticas
    constants/         ← constantes globais

  features/
    auth/
      components/      ← LoginForm (só usados por auth)
      composables/     ← useAuth, useSession
      pages/           ← login.vue, forgot-password.vue
      services/        ← authService (chama a API)
      types/           ← AuthUser, LoginPayload, SessionToken
      tests/           ← unitários co-localizados
      e2e/             ← specs Playwright desta feature
    transactions/
      ...

  layouts/             ← layouts Nuxt (default, auth)
  app.vue
```

**Regra de importação:**

```typescript
// ✅ Feature importa de shared
import { Button } from "@/shared/components/Button";
import { colors } from "@/shared/theme";

// ✅ Feature importa de si mesma
import { useAuth } from "../composables/useAuth";

// ❌ NUNCA — feature importa de outra feature
import { useTransactions } from "@/features/transactions/composables/useTransactions";
// ↑ isso em features/auth/ é uma violação
```

---

## 15. Design Tokens — Zero valores hardcoded

Nenhum valor de estilo pode aparecer diretamente em um componente.
Todo valor pertence ao sistema de tokens em `shared/theme/`.

```
shared/theme/
  tokens/
    primitives.ts    ← valores brutos (não usar em componentes)
    semantic.ts      ← tokens semânticos (use estes)
    typography.ts    ← escala tipográfica
    spacing.ts       ← escala de espaçamento
    radius.ts        ← border-radius
    shadows.ts       ← elevações/sombras
    motion.ts        ← durações e easings
  index.ts           ← exporta tudo
  index.css          ← CSS custom properties geradas dos tokens
```

```typescript
// primitives.ts — valores brutos, nunca referenciar em componentes
export const primitives = {
  color: { indigo500: "#6366F1", red500: "#EF4444", gray100: "#F3F4F6" },
  space: { 1: 4, 2: 8, 4: 16, 6: 24, 8: 32 },
} as const;

// semantic.ts — use estes nos componentes e no CSS
export const colors = {
  action: { primary: primitives.color.indigo500 },
  surface: { background: primitives.color.gray100 },
} as const;

// typography.ts
export const typography = {
  size: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, "2xl": 24 },
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
} as const;

// spacing.ts
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
```

**Em componentes Vue — via CSS custom property, nunca valor literal:**

```vue
<!-- ❌ NUNCA — valor hardcoded -->
<style scoped>
.title {
  font-size: 16px;
  color: #6366f1;
  margin-top: 8px;
}
</style>

<!-- ✅ SEMPRE — token via CSS custom property -->
<style scoped>
.title {
  font-size: var(--font-size-md); /* $font-md */
  color: var(--color-primary); /* $color-primary */
  margin-top: var(--spacing-sm); /* $space-sm */
}
</style>
```

Os tokens são expostos como CSS custom properties via `shared/theme/index.css`
e importados globalmente pelo `nuxt.config.ts`.

---

## 16. Limite de arquivo e extração

- **Máximo 250 linhas por arquivo `.vue`** (template + script + style somados).
- Acima de 250 linhas → algo deve ser extraído imediatamente.

```
Sinais de que deve extrair:
  → Arquivo > 250 linhas
  → <script setup> com > 3 refs relacionadas → composable
  → Bloco de template repetido → subcomponente
  → <style scoped> com > 15 regras → tokens ou arquivo de estilo separado
  → Computeds com lógica não trivial → composable ou util
```

```vue
<!-- ❌ Componente com lógica de negócio inline -->
<script setup lang="ts">
const transactions = ref([]);
const total = computed(() =>
  transactions.value.reduce((sum, t) => sum + t.amount, 0),
);
// ... 80 linhas de fetch, filtro, sort, paginação...
</script>

<!-- ✅ Componente limpo: delega para composable -->
<script setup lang="ts">
import { useTransactions } from "../composables/useTransactions";

const { transactions, total, isLoading, error } = useTransactions({
  userId: props.userId,
});
</script>
```

---

## 17. Zero `any` — TypeScript como Java

`any` é proibido em qualquer forma. `strict: true` e `noImplicitAny: true` estão ativos.
Trate TypeScript como Java: se não tem tipo, não compila.

```typescript
// ❌ NUNCA — nenhuma dessas formas
const data: any = response;
const result = (value as any).field;
function handle(x: any): any {
  return x;
}
const items: object[] = [];

// ✅ Discriminated union para estados de request
type RequestState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

// ✅ unknown com narrowing explícito
function parseApiError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unexpected error";
}

// ✅ Generics com restrições
function getById<T extends { id: string }>(
  list: T[],
  id: string,
): T | undefined {
  return list.find((item) => item.id === id);
}

// ✅ satisfies para validar sem perda de tipo literal
const config = {
  apiUrl: "https://api.auraxis.com",
  timeout: 5000,
} satisfies ApiConfig;
```

**Props — interface nomeada e exportada, nunca inline:**

```typescript
// ❌ NUNCA
defineProps<{ label: string; onClick: () => void }>();

// ✅ Interface nomeada + exportada
export interface ButtonProps {
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick: () => void;
}
defineProps<ButtonProps>();
```

**Composables — tipo de retorno sempre explícito e exportado:**

```typescript
// ✅
export interface UseTransactionsReturn {
  transactions: Readonly<Ref<Transaction[]>>
  isLoading: Readonly<Ref<boolean>>
  error: Readonly<Ref<Error | null>>
  refetch: () => Promise<void>
}

export function useTransactions(userId: string): UseTransactionsReturn { ... }
```

---

## 18. PWA (Web como extensão do App)

O foco primário é o app mobile. A web é a versão PWA que simula a experiência nativa.

**Requisitos obrigatórios:**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@vite-pwa/nuxt"],
  pwa: {
    manifest: {
      name: "Auraxis",
      short_name: "Auraxis",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#6366F1",
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    },
    workbox: {
      navigateFallback: "/",
      globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/api\.auraxis\.com\/.*/,
          handler: "NetworkFirst",
          options: {
            cacheName: "api-cache",
            expiration: { maxAgeSeconds: 60 },
          },
        },
      ],
    },
  },
});
```

**Gates CI para PWA (Lighthouse):**

| Métrica        | Mínimo       |
| :------------- | :----------- |
| PWA score      | ≥ 90         |
| Performance    | ≥ 85         |
| Accessibility  | ≥ 90         |
| Bundle inicial | ≤ 250KB gzip |
| LCP            | ≤ 2.5s       |

---

## Referências

- Quality gates detalhados: `.context/quality_gates.md`
- Steering (governança técnica local): `steering.md`
- **Arquitetura frontend canônica: `auraxis-platform/.context/26_frontend_architecture.md`**
- Manual unificado de qualidade e segurança: `auraxis-platform/.context/25_quality_security_playbook.md`
- Governança global: `auraxis-platform/.context/07_steering_global.md`
- Contrato de agente: `auraxis-platform/.context/08_agent_contract.md`
- Definição de pronto: `auraxis-platform/.context/23_definition_of_done.md`
