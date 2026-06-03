<script setup lang="ts">
import { computed, ref } from "vue";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Target,
  TrendingDown,
} from "lucide-vue-next";
import { NButton } from "naive-ui";

import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";
import { formatCurrency } from "~/utils/currency";

/** Upcoming/overdue bill shown in the "Próximos vencimentos" panel. */
export interface CarouselDue {
  readonly id: string;
  readonly title: string;
  readonly amount: number;
  readonly dueDate: string;
  readonly daysLeft: number;
  readonly overdue: boolean;
}

/** Active goal shown in the "Progresso de metas" panel. */
export interface CarouselGoal {
  readonly id: string;
  readonly name: string;
  readonly current: number;
  readonly target: number;
  readonly percent: number;
}

/** Top expense category shown in the "Maiores gastos" panel. */
export interface CarouselExpense {
  readonly category: string;
  readonly amount: number;
  readonly percentage: number;
}

/** Financial health summary shown in the "Saúde financeira" panel. */
export interface CarouselHealth {
  readonly score: number;
  readonly tier: "good" | "fair" | "poor";
}

interface Props {
  readonly upcomingDues: CarouselDue[];
  readonly goals: CarouselGoal[];
  readonly topExpenses: CarouselExpense[];
  readonly health: CarouselHealth | null;
}

defineProps<Props>();

const HEALTH_LABEL: Record<CarouselHealth["tier"], string> = {
  good: "saudável",
  fair: "atenção",
  poor: "crítico",
};

const slides = [
  { key: "dues", title: "Próximos vencimentos" },
  { key: "goals", title: "Progresso de metas" },
  { key: "expenses", title: "Maiores gastos do mês" },
  { key: "health", title: "Saúde financeira" },
] as const;

const activeIndex = ref<number>(0);

const activeSlide = computed(() => slides[activeIndex.value] ?? slides[0]);

/**
 * Advances the carousel, wrapping around at the ends.
 *
 * @param step Number of slides to move (+1 next, -1 previous).
 */
function go(step: number): void {
  const count = slides.length;
  activeIndex.value = (activeIndex.value + step + count) % count;
}

/**
 * Jumps directly to a slide by index.
 *
 * @param index Zero-based slide index to activate.
 */
function goTo(index: number): void {
  activeIndex.value = index;
}

/**
 * Formats an ISO date as a compact PT-BR day/month label.
 *
 * @param value ISO date string (YYYY-MM-DD).
 * @returns Compact date label.
 */
function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

/**
 * Builds the human-friendly "due in" label for an upcoming bill.
 *
 * @param due Upcoming due item.
 * @returns Short relative-time label.
 */
function dueLabel(due: CarouselDue): string {
  if (due.overdue) {
    return "vencida";
  }
  if (due.daysLeft === 0) {
    return "vence hoje";
  }
  if (due.daysLeft === 1) {
    return "vence amanhã";
  }
  return `em ${due.daysLeft} dias`;
}
</script>

<template>
  <UiSurfaceCard class="insight-carousel" padding="none" data-testid="dashboard-insight-carousel">
    <header class="insight-carousel__header">
      <div class="insight-carousel__heading">
        <h2>{{ activeSlide.title }}</h2>
        <p>Destaques acionáveis do seu mês</p>
      </div>
      <div class="insight-carousel__nav">
        <NButton
          quaternary
          circle
          size="small"
          aria-label="Painel anterior"
          data-testid="insight-carousel-prev"
          @click="go(-1)"
        >
          <template #icon><ChevronLeft :size="16" aria-hidden="true" /></template>
        </NButton>
        <NButton
          quaternary
          circle
          size="small"
          aria-label="Próximo painel"
          data-testid="insight-carousel-next"
          @click="go(1)"
        >
          <template #icon><ChevronRight :size="16" aria-hidden="true" /></template>
        </NButton>
      </div>
    </header>

    <div class="insight-carousel__body">
      <!-- Próximos vencimentos -->
      <section v-if="activeSlide.key === 'dues'" aria-label="Próximos vencimentos">
        <ul v-if="upcomingDues.length > 0" class="insight-list">
          <li v-for="due in upcomingDues" :key="due.id" class="insight-row">
            <span class="insight-row__icon" :class="{ 'insight-row__icon--alert': due.overdue }">
              <CalendarClock :size="16" aria-hidden="true" />
            </span>
            <span class="insight-row__body">
              <span class="insight-row__title">{{ due.title }}</span>
              <span class="insight-row__meta">{{ formatShortDate(due.dueDate) }} · {{ dueLabel(due) }}</span>
            </span>
            <strong class="insight-row__amount">{{ formatCurrency(due.amount) }}</strong>
          </li>
        </ul>
        <p v-else class="insight-empty">Nenhum vencimento próximo. Tudo em dia!</p>
      </section>

      <!-- Progresso de metas -->
      <section v-else-if="activeSlide.key === 'goals'" aria-label="Progresso de metas">
        <ul v-if="goals.length > 0" class="insight-list">
          <li v-for="goal in goals" :key="goal.id" class="insight-goal">
            <div class="insight-goal__head">
              <span class="insight-row__icon"><Target :size="16" aria-hidden="true" /></span>
              <span class="insight-row__title">{{ goal.name }}</span>
              <span class="insight-goal__pct">{{ goal.percent.toFixed(0) }}%</span>
            </div>
            <div class="insight-goal__track">
              <span :style="{ width: `${Math.min(goal.percent, 100)}%` }" />
            </div>
            <span class="insight-row__meta">
              {{ formatCurrency(goal.current) }} de {{ formatCurrency(goal.target) }}
            </span>
          </li>
        </ul>
        <p v-else class="insight-empty">Você ainda não criou metas. Que tal começar uma?</p>
      </section>

      <!-- Maiores gastos do mês -->
      <section v-else-if="activeSlide.key === 'expenses'" aria-label="Maiores gastos do mês">
        <ul v-if="topExpenses.length > 0" class="insight-list">
          <li v-for="expense in topExpenses" :key="expense.category" class="insight-row">
            <span class="insight-row__icon insight-row__icon--alert">
              <TrendingDown :size="16" aria-hidden="true" />
            </span>
            <span class="insight-row__body">
              <span class="insight-row__title">{{ expense.category }}</span>
              <span class="insight-row__meta">{{ expense.percentage.toFixed(0) }}% das despesas</span>
            </span>
            <strong class="insight-row__amount">{{ formatCurrency(expense.amount) }}</strong>
          </li>
        </ul>
        <p v-else class="insight-empty">Sem despesas categorizadas neste período.</p>
      </section>

      <!-- Saúde financeira -->
      <section v-else aria-label="Saúde financeira" class="insight-health">
        <template v-if="health">
          <div class="insight-health__score" :class="`insight-health__score--${health.tier}`">
            <HeartPulse :size="22" aria-hidden="true" />
            <strong>{{ Math.round(health.score) }}</strong>
            <span>/ 100</span>
          </div>
          <p class="insight-health__label" :class="`insight-health__label--${health.tier}`">
            {{ HEALTH_LABEL[health.tier] }}
          </p>
          <p class="insight-row__meta">Índice consolidado de comprometimento, reserva, metas e diversificação.</p>
        </template>
        <p v-else class="insight-empty">
          Cadastre receitas e despesas para calcular sua saúde financeira.
        </p>
      </section>
    </div>

    <footer class="insight-carousel__dots" aria-label="Selecionar painel">
      <button
        v-for="(slide, index) in slides"
        :key="slide.key"
        type="button"
        class="insight-carousel__dot"
        :class="{ 'insight-carousel__dot--active': index === activeIndex }"
        :aria-label="slide.title"
        :aria-current="index === activeIndex"
        @click="goTo(index)"
      />
    </footer>
  </UiSurfaceCard>
</template>

<style scoped>
.insight-carousel {
  display: grid;
  gap: var(--space-3);
  min-height: calc(var(--space-9) * 3);
}

.insight-carousel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-4) 0;
}

.insight-carousel__heading h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.insight-carousel__heading p {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.insight-carousel__nav {
  display: flex;
  gap: var(--space-1);
  flex-shrink: 0;
}

.insight-carousel__body {
  padding: 0 var(--space-4);
  min-height: calc(var(--space-9) * 2);
}

.insight-list {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.insight-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.insight-row__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--space-6);
  height: var(--space-6);
  border: var(--space-px) solid var(--color-outline-soft);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  color: var(--color-brand-500);
  flex-shrink: 0;
}

.insight-row__icon--alert {
  color: var(--color-negative);
}

.insight-row__body {
  display: grid;
  gap: var(--space-1);
  flex: 1;
  min-width: 0;
}

.insight-row__title {
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.insight-row__meta {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.insight-row__amount {
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

.insight-goal {
  display: grid;
  gap: var(--space-1);
}

.insight-goal__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.insight-goal__head .insight-row__title {
  flex: 1;
}

.insight-goal__pct {
  color: var(--color-brand-500);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.insight-goal__track {
  height: var(--space-1);
  border-radius: var(--radius-full);
  background: var(--color-outline-soft);
  overflow: hidden;
}

.insight-goal__track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-brand-500), var(--color-accent));
}

.insight-health {
  display: grid;
  gap: var(--space-2);
  place-items: start;
}

.insight-health__score {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2);
  color: var(--color-text-primary);
}

.insight-health__score strong {
  font-family: var(--font-mono);
  font-size: var(--font-size-2xl);
}

.insight-health__score--good { color: var(--color-positive); }
.insight-health__score--fair { color: var(--color-warning); }
.insight-health__score--poor { color: var(--color-negative); }

.insight-health__label {
  margin: 0;
  font-weight: var(--font-weight-semibold);
}

.insight-health__label--good { color: var(--color-positive); }
.insight-health__label--fair { color: var(--color-warning); }
.insight-health__label--poor { color: var(--color-negative); }

.insight-empty {
  margin: 0;
  padding-block: var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.insight-carousel__dots {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  padding: 0 var(--space-4) var(--space-4);
}

.insight-carousel__dot {
  width: var(--space-2);
  height: var(--space-2);
  padding: 0;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-outline-soft);
  cursor: pointer;
  transition: background 0.2s ease;
}

.insight-carousel__dot--active {
  background: var(--color-brand-500);
}
</style>
