<script setup lang="ts">
import { computed } from "vue";
import { NButton } from "naive-ui";

import UiIcon from "~/components/ui/UiIcon/UiIcon.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";
import { formatCurrency } from "~/utils/currency";

import type { CreditCardDto } from "../contracts/credit-card.dto";
import type { StatementViewModel } from "../model/credit-card-statement";
import type { EnrichedTransaction } from "../utils/transaction-billing";
import { resolveCardTheme } from "../utils/card-brand-theme";
import { formatDayMonth } from "../utils/format";
import CreditCardBillsAreaTrend from "./charts/CreditCardBillsAreaTrend.vue";
import CreditCardCategoryHBars from "./charts/CreditCardCategoryHBars.vue";
import CreditCardMonthSwitcher from "./CreditCardMonthSwitcher.vue";
import CreditCardRailItem from "./CreditCardRailItem.vue";

const props = defineProps<{
  statement: StatementViewModel;
  cards: readonly CreditCardDto[];
  selectedCardId: string | null;
  /** Modo cartão único (página de detalhe): esconde o rail e o CRUD. */
  singleCard?: boolean;
}>();

const emit = defineEmits<{
  "select-card": [cardId: string | null];
  "shift-month": [delta: number];
  "add-expense": [];
  "add-card": [];
  "edit-card": [card: CreditCardDto];
  "delete-card": [card: CreditCardDto];
  "edit-expense": [transaction: EnrichedTransaction];
  "duplicate-expense": [transaction: EnrichedTransaction];
  "delete-expense": [transaction: EnrichedTransaction];
}>();

const selectedCard = computed<CreditCardDto | null>(
  () => props.cards.find((card) => card.id === props.selectedCardId) ?? null,
);

const railCards = computed(() =>
  props.cards.map((card) => {
    const total = props.statement.railTotals.find((entry) => entry.cardId === card.id)?.total ?? 0;
    const theme = resolveCardTheme(card);
    const util =
      card.limit_amount && card.limit_amount > 0 ? (total / card.limit_amount) * 100 : null;
    return { card, total, color: theme.color, color2: theme.color2, util };
  }),
);

const eyebrow = computed<string>(() =>
  selectedCard.value ? selectedCard.value.name : "Fatura consolidada",
);

const hbarItems = computed(() =>
  props.statement.categories.map((category) => ({
    label: category.name,
    value: category.total,
    color: category.color,
  })),
);

const categoryByItemId = computed(() => {
  const map = new Map<string, { name: string; color: string }>();
  for (const category of props.statement.categories) {
    for (const item of category.items) {
      map.set(item.id, { name: category.name, color: category.color });
    }
  }
  return map;
});

/**
 * Resolve categoria visual de um lançamento da fatura.
 *
 * @param item Lançamento enriquecido.
 * @returns Nome e cor já derivados da categoria/tag.
 */
const categoryForItem = (item: EnrichedTransaction): { name: string; color: string } =>
  categoryByItemId.value.get(item.id) ?? { name: "Sem categoria", color: "var(--color-text-muted)" };

/**
 * Formata a data do lançamento como DD/MM/AAAA para a lista da fatura.
 *
 * @param isoDate Data ISO YYYY-MM-DD.
 * @returns Data em formato brasileiro.
 */
const formatFullDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-");
  return `${day ?? "--"}/${month ?? "--"}/${year ?? "----"}`;
};

/**
 * Formata despesa com sinal negativo, preservando a tipografia monetária local.
 *
 * @param amount Valor positivo da despesa.
 * @returns Valor exibido na linha.
 */
const formatExpenseAmount = (amount: number): string => `- ${formatCurrency(amount)}`;

const trendColor = computed<string>(() => {
  if (selectedCard.value) {
    return resolveCardTheme(selectedCard.value).color;
  }
  const topCardId = props.statement.railTotals[0]?.cardId;
  const topCard = topCardId ? props.cards.find((card) => card.id === topCardId) : null;
  return topCard ? resolveCardTheme(topCard).color : "#087FA7";
});
</script>

<template>
  <div class="fat" :class="{ 'fat--single': singleCard }">
    <aside v-if="!singleCard" class="fat__rail">
      <CreditCardRailItem
        label="Todos os cartões"
        :subtitle="`${cards.length} ${cards.length === 1 ? 'ativo' : 'ativos'}`"
        :amount="statement.allCardsTotal"
        :selected="selectedCardId === null"
        color="var(--color-brand-500)"
        is-all
        @select="emit('select-card', null)"
      />

      <CreditCardRailItem
        v-for="entry in railCards"
        :key="entry.card.id"
        :label="entry.card.name"
        :subtitle="entry.card.bank ?? 'Cartão'"
        :amount="entry.total"
        :selected="selectedCardId === entry.card.id"
        :color="entry.color"
        :color2="entry.color2"
        :brand="entry.card.brand"
        :utilization-pct="entry.util"
        @select="emit('select-card', entry.card.id)"
      />

      <button
        type="button"
        class="fat__add-card"
        data-testid="cc-rail-add-card"
        @click="emit('add-card')"
      >
        <UiIcon name="plus" :size="16" /> Adicionar cartão
      </button>
    </aside>

    <UiSurfaceCard as="section" class="fat__statement" padding="none">
      <header class="fat__head">
        <CreditCardMonthSwitcher
          :month-label="statement.monthLabel"
          @shift="(delta) => emit('shift-month', delta)"
        />
        <div class="fat__head-actions">
          <NButton
            v-if="selectedCard && !singleCard"
            size="small"
            tertiary
            data-testid="cc-edit-card"
            @click="emit('edit-card', selectedCard)"
          >
            Editar cartão
          </NButton>
          <NButton
            v-if="selectedCard && !singleCard"
            size="small"
            tertiary
            type="error"
            data-testid="cc-delete-card"
            @click="emit('delete-card', selectedCard)"
          >
            Remover cartão
          </NButton>
          <NButton size="small" type="primary" data-testid="cc-add-expense-faturas" @click="emit('add-expense')">
            <template #icon><UiIcon name="plus" :size="14" /></template>
            Lançar despesa
          </NButton>
        </div>
      </header>

      <div class="fat__summary">
        <div class="fat__summary-main">
          <span class="fat__eyebrow">{{ eyebrow }}</span>
          <h2 class="fat__title">Fatura de <span class="fat__title-month">{{ statement.monthLabel }}</span></h2>
          <strong class="fat__value">{{ formatCurrency(statement.total) }}</strong>
        </div>
        <div class="fat__summary-side">
          <span
            v-if="statement.status"
            class="fat__status"
            :class="`fat__status--${statement.status.tone}`"
          >
            <UiIcon name="clock" :size="13" /> {{ statement.status.label }}
          </span>
          <span class="fat__meta">Vence dia {{ formatDayMonth(statement.dueDate) }}</span>
          <span class="fat__meta">{{ statement.itemCount }} {{ statement.itemCount === 1 ? "item" : "itens" }}</span>
        </div>
      </div>

      <section v-if="hbarItems.length" class="fat__section">
        <span class="fat__section-title">Onde foi gasto</span>
        <CreditCardCategoryHBars :items="hbarItems" :limit="6" />
      </section>

      <section v-if="statement.items.length" class="fat__section">
        <span class="fat__section-title">Itens da fatura</span>
        <ul class="fat__items" aria-label="Lançamentos da fatura">
          <li v-for="item in statement.items" :key="item.id" class="fat__item">
            <span class="fat__item-date">{{ formatFullDate(item.purchaseDate) }}</span>
            <span class="fat__item-main">
              <span class="fat__item-topline">
                <button
                  type="button"
                  class="fat__item-title"
                  :data-testid="`cc-bill-item-title-${item.id}`"
                  @click="emit('edit-expense', item)"
                >
                  {{ item.title }}
                </button>
                <span
                  class="fat__category-chip"
                  :style="{ color: categoryForItem(item).color }"
                >
                  {{ categoryForItem(item).name }}
                </span>
                <span
                  v-if="item.isInstallment && item.installmentCount"
                  class="fat__badge"
                >
                  {{ item.installmentCount }}x
                </span>
                <span v-if="item.isRecurring" class="fat__recurring">
                  Recorrente
                </span>
              </span>
              <button
                type="button"
                class="fat__sync"
                @click="emit('edit-expense', item)"
              >
                <UiIcon name="transactions" :size="12" /> Também em Transações
              </button>
            </span>
            <span class="fat__item-amount">{{ formatExpenseAmount(item.amount) }}</span>
            <span class="fat__item-actions" aria-label="Ações do lançamento">
              <button
                type="button"
                class="fat__icon-button"
                :data-testid="`cc-bill-item-edit-${item.id}`"
                aria-label="Editar despesa"
                title="Editar despesa"
                @click="emit('edit-expense', item)"
              >
                <UiIcon name="edit" :size="15" />
              </button>
              <button
                type="button"
                class="fat__icon-button"
                :data-testid="`cc-bill-item-duplicate-${item.id}`"
                aria-label="Duplicar despesa"
                title="Duplicar despesa"
                @click="emit('duplicate-expense', item)"
              >
                <UiIcon name="copy" :size="15" />
              </button>
              <button
                type="button"
                class="fat__icon-button fat__icon-button--danger"
                :data-testid="`cc-bill-item-delete-${item.id}`"
                aria-label="Remover despesa"
                title="Remover despesa"
                @click="emit('delete-expense', item)"
              >
                <UiIcon name="trash" :size="15" />
              </button>
            </span>
          </li>
        </ul>
      </section>

      <p v-else class="fat__empty">Nenhum lançamento nesta fatura.</p>

      <section class="fat__section fat__section--trend">
        <span class="fat__section-title">Faturas anteriores</span>
        <CreditCardBillsAreaTrend
          :labels="statement.monthlyTrend.map((point) => point.label)"
          :values="statement.monthlyTrend.map((point) => point.total)"
          :color="trendColor"
        />
      </section>
    </UiSurfaceCard>
  </div>
</template>

<style scoped>
.fat {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: var(--space-3);
  align-items: start;
}
.fat--single {
  grid-template-columns: 1fr;
}
.fat__rail {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.fat__add-card {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: var(--space-3);
  border: 1.5px dashed var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.fat__add-card:hover {
  border-color: var(--color-brand-500);
  color: var(--color-brand-500);
}
.fat__statement {
  display: flex;
  flex-direction: column;
}
.fat__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-outline-soft);
  flex-wrap: wrap;
}
.fat__head-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.fat__summary {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
}
.fat__summary-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fat__eyebrow {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}
.fat__title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
.fat__title-month {
  display: inline-block;
}
.fat__title-month::first-letter {
  text-transform: uppercase;
}
.fat__value {
  font-family: var(--font-mono);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
.fat__summary-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.fat__status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}
.fat__status--open {
  background: var(--color-brand-hover-surface, var(--color-bg-elevated));
  color: var(--color-brand-500);
}
.fat__status--closed {
  background: var(--color-positive-bg);
  color: var(--color-positive);
}
.fat__meta {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
.fat__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border-top: 1px solid var(--color-outline-soft);
}
.fat__section-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
.fat__items {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}
.fat__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 15px 6px;
  border-bottom: 1px solid var(--color-outline-soft);
}
.fat__item:last-child {
  border-bottom: 0;
}
.fat__item-title {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  transition: color 0.15s ease, text-decoration-color 0.15s ease;
}
.fat__item-title:hover,
.fat__item-title:focus-visible {
  color: var(--color-brand-500);
  text-decoration: underline;
  outline: none;
}
.fat__item-main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fat__item-topline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.fat__category-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  background: var(--color-bg-elevated);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}
.fat__badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  background: var(--color-bg-elevated);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
}
.fat__item-date {
  width: 82px;
  flex: none;
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.fat__item-amount {
  min-width: 126px;
  text-align: right;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-negative);
  white-space: nowrap;
}
.fat__sync {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  align-self: flex-start;
  border: 0;
  background: transparent;
  padding: 0;
  color: var(--color-brand-500);
  cursor: pointer;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}
.fat__sync:hover,
.fat__sync:focus-visible {
  text-decoration: underline;
  outline: none;
}
.fat__recurring {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.fat__item-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}
.fat__icon-button {
  width: 34px;
  height: 34px;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-sm);
  background: var(--color-bg-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.fat__icon-button:hover,
.fat__icon-button:focus-visible {
  border-color: var(--color-brand-500);
  background: var(--color-bg-elevated);
  color: var(--color-brand-500);
  outline: none;
}
.fat__icon-button--danger:hover,
.fat__icon-button--danger:focus-visible {
  border-color: var(--color-negative);
  background: var(--color-negative-bg);
  color: var(--color-negative);
}
.fat__empty {
  margin: 0;
  padding: var(--space-3);
  color: var(--color-text-muted);
  border-top: 1px solid var(--color-outline-soft);
}
@media (max-width: 980px) {
  .fat {
    grid-template-columns: 1fr;
  }
  .fat__item {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .fat__item-date {
    width: auto;
  }
  .fat__item-amount {
    margin-left: auto;
  }
}
</style>
