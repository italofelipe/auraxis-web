<script setup lang="ts">
import { ShieldCheck, Sparkles } from "lucide-vue-next";

const { t } = useI18n();
</script>

<template>
  <aside class="summary-bar" :aria-label="t('auth.login.summary.title')">
    <div class="summary-bar__period">
      <span class="summary-bar__month">{{ t("auth.login.summary.month") }}</span>
      <span class="summary-bar__caption">{{ t("auth.login.summary.title") }}</span>
    </div>

    <span class="summary-bar__divider" aria-hidden="true" />

    <dl class="summary-bar__stats">
      <div class="summary-bar__stat">
        <dt>{{ t("auth.login.summary.balanceLabel") }}</dt>
        <dd class="summary-bar__value">{{ t("auth.login.summary.balanceValue") }}</dd>
      </div>
      <div class="summary-bar__stat">
        <dt>{{ t("auth.login.summary.reserveLabel") }}</dt>
        <dd class="summary-bar__value summary-bar__value--positive">
          {{ t("auth.login.summary.reserveValue") }}
        </dd>
      </div>
      <div class="summary-bar__stat">
        <dt>{{ t("auth.login.summary.alertsLabel") }}</dt>
        <dd class="summary-bar__value summary-bar__value--warning">
          {{ t("auth.login.summary.alertsValue") }}
        </dd>
      </div>
    </dl>

    <svg
      class="summary-bar__chart"
      viewBox="0 0 120 46"
      width="120"
      height="46"
      preserveAspectRatio="none"
      role="img"
      :aria-label="t('auth.login.summary.title')"
    >
      <defs>
        <linearGradient id="summarySpark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--summary-chart-line)" stop-opacity="0.25" />
          <stop offset="1" stop-color="var(--summary-chart-line)" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,34 C16,30 26,28 40,24 C56,20 64,21 80,15 C96,9 106,10 120,4 L120,46 L0,46 Z"
        fill="url(#summarySpark)"
      />
      <path
        d="M0,34 C16,30 26,28 40,24 C56,20 64,21 80,15 C96,9 106,10 120,4"
        fill="none"
        stroke="var(--summary-chart-line)"
        stroke-width="2.5"
        stroke-linecap="round"
      />
    </svg>

    <p class="summary-bar__insight">
      <Sparkles class="summary-bar__insight-icon" :size="18" aria-hidden="true" />
      <span>
        <strong>{{ t("auth.login.summary.insightLabel") }}</strong>
        {{ t("auth.login.summary.insightText") }}
      </span>
    </p>

    <span class="summary-bar__protected">
      <ShieldCheck :size="13" aria-hidden="true" />
      {{ t("auth.login.summary.protected") }}
    </span>
  </aside>
</template>

<style scoped>
.summary-bar {
  --summary-chart-line: #1e88a6;
  display: flex;
  align-items: center;
  gap: 26px;
  padding: 16px 22px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-card-sm, 0 10px 24px rgba(13, 40, 64, 0.06));
  color: var(--color-text-primary);
}

.summary-bar__period {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-bar__month {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.summary-bar__caption {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.summary-bar__divider {
  flex: none;
  width: 1px;
  height: 38px;
  background: var(--color-outline-soft);
}

.summary-bar__stats {
  flex: none;
  display: flex;
  gap: 30px;
  margin: 0;
}

.summary-bar__stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-bar__stat dt {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.summary-bar__value {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.summary-bar__value--positive {
  color: var(--color-positive);
}

.summary-bar__value--warning {
  color: var(--color-warning, #b7791f);
}

.summary-bar__chart {
  flex: none;
  width: 120px;
  height: 46px;
}

.summary-bar__insight {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-brand-500) 9%, var(--color-bg-surface));
  font-size: var(--font-size-xs);
  line-height: 1.45;
  color: var(--color-text-secondary);
}

.summary-bar__insight-icon {
  flex: none;
  color: var(--color-brand-500);
}

.summary-bar__insight strong {
  color: var(--color-text-primary);
}

.summary-bar__protected {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-positive) 14%, var(--color-bg-surface));
  color: var(--color-positive);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

/* Tablet: drop the sparkline first, then the insight, to avoid overflow. */
@media (max-width: 1100px) {
  .summary-bar {
    gap: 18px;
  }

  .summary-bar__chart {
    display: none;
  }
}

@media (max-width: 920px) {
  .summary-bar__insight {
    display: none;
  }
}

/* Mobile: stack into a readable list. */
@media (max-width: 860px) {
  .summary-bar {
    flex-wrap: wrap;
    gap: 14px;
  }

  .summary-bar__divider {
    display: none;
  }

  .summary-bar__stats {
    width: 100%;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .summary-bar__insight {
    display: flex;
    flex: 1 1 100%;
  }

  .summary-bar__protected {
    margin-left: auto;
  }
}
</style>
