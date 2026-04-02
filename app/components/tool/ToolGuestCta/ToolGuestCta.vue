<script setup lang="ts">
import type { Component } from "vue";
import { BarChart3, Target, ShieldCheck, Zap, Sparkles, ArrowRight } from "lucide-vue-next";
import { NButton } from "naive-ui";
import { useRouter } from "#app";
import { useI18n } from "vue-i18n";
import { useToolCta } from "~/composables/useToolCta";

/**
 * A feature highlight shown inside the guest CTA panel.
 */
interface CtaFeature {
  /** i18n key suffix — resolves to `toolGuestCta.features.<key>.title/desc`. */
  key: string;
  /** Lucide icon component to display. */
  icon: Component;
  /** Accent color token for the icon background. */
  color: "blue" | "green" | "purple" | "amber";
}

/**
 * The four platform benefits shown in the CTA feature grid.
 * Kept as a typed constant so the template stays declarative and DRY.
 */
const CTA_FEATURES: readonly CtaFeature[] = [
  { key: "portfolio", icon: BarChart3, color: "blue" },
  { key: "goals",     icon: Target,    color: "green" },
  { key: "security",  icon: ShieldCheck, color: "purple" },
  { key: "tools",     icon: Zap,       color: "amber" },
] as const;

const { showCta } = useToolCta();
const router = useRouter();
const { t } = useI18n();

/** Navigates the visitor to the registration page. */
const goToRegister = (): void => {
  void router.push("/auth/register");
};

/** Navigates the visitor to the login page. */
const goToLogin = (): void => {
  void router.push("/auth/login");
};
</script>

<template>
  <section
    v-if="showCta"
    class="tool-guest-cta"
    :aria-label="t('toolGuestCta.ariaLabel')"
  >
    <div class="tool-guest-cta__inner">
      <!-- ── Illustration ───────────────────────────────────────────────── -->
      <IllustrationFinanceGrowth class="tool-guest-cta__illustration" />

      <!-- ── Headline ─────────────────────────────────────────────────────── -->
      <div class="tool-guest-cta__headline">
        <div class="tool-guest-cta__badge">
          <Sparkles :size="14" aria-hidden="true" />
          {{ t("toolGuestCta.badge") }}
        </div>

        <h2 class="tool-guest-cta__title">
          {{ t("toolGuestCta.title") }}
        </h2>

        <p class="tool-guest-cta__subtitle">
          {{ t("toolGuestCta.subtitle") }}
        </p>
      </div>

      <!-- ── Feature grid ──────────────────────────────────────────────────── -->
      <ul class="tool-guest-cta__features" :aria-label="t('toolGuestCta.featuresAriaLabel')">
        <li
          v-for="feature in CTA_FEATURES"
          :key="feature.key"
          class="tool-guest-cta__feature"
        >
          <div
            class="tool-guest-cta__feature-icon"
            :class="`tool-guest-cta__feature-icon--${feature.color}`"
          >
            <component :is="feature.icon" :size="22" aria-hidden="true" />
          </div>

          <div>
            <strong class="tool-guest-cta__feature-title">
              {{ t(`toolGuestCta.features.${feature.key}.title`) }}
            </strong>
            <span class="tool-guest-cta__feature-desc">
              {{ t(`toolGuestCta.features.${feature.key}.desc`) }}
            </span>
          </div>
        </li>
      </ul>

      <!-- ── Actions ──────────────────────────────────────────────────────── -->
      <div class="tool-guest-cta__actions">
        <NButton
          type="primary"
          size="large"
          class="tool-guest-cta__primary-btn"
          @click="goToRegister"
        >
          {{ t("toolGuestCta.registerCta") }}
          <ArrowRight :size="16" aria-hidden="true" />
        </NButton>

        <NButton quaternary size="large" @click="goToLogin">
          {{ t("toolGuestCta.loginCta") }}
        </NButton>
      </div>

      <!-- ── Trust line ────────────────────────────────────────────────────── -->
      <p class="tool-guest-cta__trust">
        {{ t("toolGuestCta.trust") }}
      </p>
    </div>
  </section>
</template>

<style scoped>
/* ── Illustration ──────────────────────────────────────────────────────────── */
.tool-guest-cta__illustration {
  width: 100%;
  max-width: 320px;
  height: auto;
}

/* ── Root ──────────────────────────────────────────────────────────────────── */
.tool-guest-cta {
  background: linear-gradient(
    135deg,
    var(--color-bg-surface) 0%,
    var(--color-bg-elevated) 100%
  );
  border-top: 1px solid var(--color-outline-soft);
  padding: var(--space-10, 40px) var(--space-6, 24px);
}

.tool-guest-cta__inner {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8, 32px);
  text-align: center;
}

/* ── Badge ─────────────────────────────────────────────────────────────────── */
.tool-guest-cta__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1, 4px);
  padding: 4px 12px;
  border-radius: var(--border-radius-full, 9999px);
  background: var(--color-brand-600);
  color: #fff;
  font-size: var(--font-size-body-xs, 11px);
  font-weight: var(--font-weight-semibold, 600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Headline ──────────────────────────────────────────────────────────────── */
.tool-guest-cta__headline {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3, 12px);
}

.tool-guest-cta__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-lg, 28px);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-text-primary);
  line-height: 1.25;
  max-width: 600px;
}

.tool-guest-cta__subtitle {
  margin: 0;
  font-size: var(--font-size-body-md, 16px);
  color: var(--color-text-secondary);
  max-width: 560px;
  line-height: 1.6;
}

/* ── Feature grid ──────────────────────────────────────────────────────────── */
.tool-guest-cta__features {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4, 16px);
  width: 100%;
  max-width: 720px;
  text-align: left;
}

.tool-guest-cta__feature {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3, 12px);
  background: var(--color-bg-base);
  border: 1px solid var(--color-outline-subtle);
  border-radius: var(--radius-md, 8px);
  padding: var(--space-4, 16px);
}

.tool-guest-cta__feature-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm, 6px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tool-guest-cta__feature-icon--blue   { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.tool-guest-cta__feature-icon--green  { background: rgba(34, 197, 94, 0.15);  color: #4ade80; }
.tool-guest-cta__feature-icon--purple { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
.tool-guest-cta__feature-icon--amber  { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }

.tool-guest-cta__feature-title {
  display: block;
  font-size: var(--font-size-body-sm, 14px);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1, 4px);
}

.tool-guest-cta__feature-desc {
  display: block;
  font-size: var(--font-size-body-xs, 12px);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* ── Actions ───────────────────────────────────────────────────────────────── */
.tool-guest-cta__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-3, 12px);
}

.tool-guest-cta__primary-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1, 4px);
}

/* ── Trust line ─────────────────────────────────────────────────────────────── */
.tool-guest-cta__trust {
  margin: 0;
  font-size: var(--font-size-body-xs, 12px);
  color: var(--color-text-muted);
}

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 639px) {
  .tool-guest-cta__features {
    grid-template-columns: 1fr;
  }

  .tool-guest-cta__title {
    font-size: var(--font-size-heading-md, 22px);
  }

  .tool-guest-cta__actions {
    flex-direction: column;
    width: 100%;
  }
}
</style>
