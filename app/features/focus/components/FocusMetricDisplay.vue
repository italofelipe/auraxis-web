<script setup lang="ts">
import { computed } from "vue";
import { TrendingUp, TrendingDown, Minus } from "lucide-vue-next";
import type { FocusMetric } from "../model/focus-metric";

interface Props {
  readonly metric: FocusMetric;
  readonly isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), { isLoading: false });

const { t, n } = useI18n();

const formattedValue = computed<string>(() => {
  const { unit, value, unavailable } = props.metric;
  if (unavailable) { return "—"; }
  if (unit === "currency") {
    return n(value, { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  }
  if (unit === "percent") {
    return `${Math.round(value)}%`;
  }
  return String(Math.round(value));
});

const suffixKey = computed<string | null>(() => {
  if (props.metric.unavailable) { return null; }
  if (props.metric.unit === "days") { return "focus.display.suffix.days"; }
  return null;
});

const trendIcon = computed(() => {
  if (!props.metric.trend) { return null; }
  if (props.metric.trend.direction === "up") { return TrendingUp; }
  if (props.metric.trend.direction === "down") { return TrendingDown; }
  return Minus;
});

/**
 * Picks the prefix used to render a signed trend delta.
 *
 * @param delta Signed trend delta.
 * @returns "+" for positive, "" for negative (Math.abs strips the sign), "±" for zero.
 */
function trendSign(delta: number): string {
  if (delta > 0) { return "+"; }
  if (delta < 0) { return ""; }
  return "±";
}

const trendText = computed<string | null>(() => {
  const trend = props.metric.trend;
  if (!trend) { return null; }
  const sign = trendSign(trend.delta);
  if (trend.percent !== null) {
    return `${sign}${Math.round(Math.abs(trend.percent))}%`;
  }
  return null;
});

const trendDirectionClass = computed(() => {
  if (!props.metric.trend) { return ""; }
  return `focus-metric__trend--${props.metric.trend.direction}`;
});
</script>

<template>
  <div class="focus-metric" data-testid="focus-metric-display">
    <template v-if="isLoading">
      <span class="focus-metric__loading" aria-live="polite">{{ t("focus.display.loading") }}</span>
    </template>
    <template v-else>
      <span class="focus-metric__label">{{ t(metric.labelKey) }}</span>
      <div class="focus-metric__value-row">
        <span class="focus-metric__value" data-testid="focus-metric-value">{{ formattedValue }}</span>
        <span v-if="suffixKey" class="focus-metric__suffix">{{ t(suffixKey) }}</span>
      </div>
      <div v-if="trendIcon && trendText" class="focus-metric__trend" :class="trendDirectionClass" data-testid="focus-metric-trend">
        <component :is="trendIcon" :size="16" />
        <span>{{ trendText }}</span>
      </div>
      <p v-if="metric.unavailable" class="focus-metric__unavailable">
        {{ t(`focus.metrics.${metric.id}.unavailable`) }}
      </p>
      <p v-else-if="metric.captionKey" class="focus-metric__caption">
        {{ t(metric.captionKey) }}
      </p>
    </template>
  </div>
</template>

<style scoped>
.focus-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  text-align: center;
  color: var(--color-text-primary);
}

.focus-metric__label {
  font-size: var(--font-size-sm);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.focus-metric__value-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.focus-metric__value {
  font-family: var(--font-heading);
  font-size: clamp(4rem, 12vw, 8rem);
  font-weight: var(--font-weight-bold);
  line-height: 1;
  color: var(--color-text-primary);
}

.focus-metric__suffix {
  font-size: var(--font-size-lg);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-medium);
}

.focus-metric__trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: var(--color-bg-elevated);
}

.focus-metric__trend--up { color: var(--color-positive); }
.focus-metric__trend--down { color: var(--color-negative); }
.focus-metric__trend--flat { color: var(--color-text-muted); }

.focus-metric__caption,
.focus-metric__unavailable {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
  max-width: 32ch;
}

.focus-metric__loading {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
