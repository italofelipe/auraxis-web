<script setup lang="ts">
import { computed } from "vue";
import { NButton } from "naive-ui";

import UiIcon from "~/components/ui/UiIcon/UiIcon.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";
import { formatCurrency } from "~/utils/currency";

import type { CreditCardDto } from "../contracts/credit-card.dto";
import type { StatementViewModel } from "../model/credit-card-statement";
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
            Editar
          </NButton>
          <NButton
            v-if="selectedCard && !singleCard"
            size="small"
            tertiary
            type="error"
            data-testid="cc-delete-card"
            @click="emit('delete-card', selectedCard)"
          >
            Remover
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

      <section v-if="statement.categories.length" class="fat__section">
        <span class="fat__section-title">Itens da fatura</span>
        <div class="fat__groups">
          <div v-for="group in statement.categories" :key="group.tagId ?? 'none'" class="fat__group">
            <div class="fat__group-head">
              <span class="fat__dot" :style="{ background: group.color }" />
              <span class="fat__group-name">{{ group.name }}</span>
              <span class="fat__group-line" />
              <span class="fat__group-total">{{ formatCurrency(group.total) }}</span>
            </div>
            <ul class="fat__items">
              <li v-for="item in group.items" :key="item.id" class="fat__item">
                <span class="fat__item-title">{{ item.title }}</span>
                <span
                  v-if="item.isInstallment && item.installmentCount"
                  class="fat__badge"
                >{{ item.installmentCount }}x</span>
                <span class="fat__item-spacer" />
                <span class="fat__item-date">{{ formatDayMonth(item.purchaseDate) }}</span>
                <span class="fat__item-amount">{{ formatCurrency(item.amount) }}</span>
              </li>
            </ul>
          </div>
        </div>
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
  background: rgba(22, 163, 74, 0.14);
  color: #16a34a;
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
.fat__groups {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.fat__group-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: 4px;
}
.fat__dot {
  width: 9px;
  height: 9px;
  border-radius: var(--radius-xs);
  flex-shrink: 0;
}
.fat__group-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.fat__group-line {
  flex: 1;
  border-bottom: 1px dashed var(--color-outline-soft);
}
.fat__group-total {
  font-family: var(--font-mono);
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
  padding: 7px 4px;
}
.fat__item-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}
.fat__badge {
  padding: 1px 7px;
  border-radius: var(--radius-full);
  background: var(--color-bg-elevated);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.fat__item-spacer {
  flex: 1;
}
.fat__item-date {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.fat__item-amount {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
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
}
</style>
