<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";

import {
  acceptAllCookieConsent,
  readCookieConsent,
  rejectOptionalCookieConsent,
  saveCookieConsent,
  subscribeToCookieConsentChanges,
  type CookieConsentPreferences,
} from "~/shared/privacy/cookie-consent";

const isReady = ref(false);
const savedPreferences = ref<CookieConsentPreferences | null>(null);
const isConfiguring = ref(false);
const granularPreferences = reactive({
  analytics: true,
  marketing: false,
});

let unsubscribe: (() => void) | null = null;

const isVisible = computed(() => isReady.value && savedPreferences.value === null);

/**
 * Mirrors persisted preferences into the local banner state.
 *
 * @param preferences Persisted cookie preferences, or null when none exist.
 */
const syncFromSavedPreferences = (preferences: CookieConsentPreferences | null): void => {
  savedPreferences.value = preferences;

  if (preferences) {
    granularPreferences.analytics = preferences.analytics;
    granularPreferences.marketing = preferences.marketing;
  }
};

/** Accepts all optional cookie categories and hides the banner. */
const acceptAll = (): void => {
  syncFromSavedPreferences(acceptAllCookieConsent());
};

/** Rejects every optional cookie category and hides the banner. */
const rejectOptional = (): void => {
  syncFromSavedPreferences(rejectOptionalCookieConsent());
};

/** Persists the granular category choices selected by the visitor. */
const saveGranularPreferences = (): void => {
  syncFromSavedPreferences(saveCookieConsent({
    analytics: granularPreferences.analytics,
    marketing: granularPreferences.marketing,
  }));
};

onMounted(() => {
  syncFromSavedPreferences(readCookieConsent());
  isReady.value = true;
  unsubscribe = subscribeToCookieConsentChanges(syncFromSavedPreferences);
});

onBeforeUnmount(() => {
  unsubscribe?.();
});
</script>

<template>
  <section
    v-if="isVisible"
    class="cookie-consent"
    role="region"
    aria-label="Preferências de cookies"
  >
    <div class="cookie-consent__content">
      <p class="cookie-consent__eyebrow">LGPD</p>
      <h2 class="cookie-consent__title">Controle seus cookies</h2>
      <p class="cookie-consent__text">
        Usamos cookies necessários para manter o Auraxis seguro. Analytics e
        marketing só ficam ativos com o seu consentimento.
      </p>
      <a class="cookie-consent__policy" href="/privacy-policy">
        Ver política de privacidade
      </a>
    </div>

    <div v-if="isConfiguring" class="cookie-consent__preferences">
      <label class="cookie-consent__option cookie-consent__option--disabled">
        <input type="checkbox" checked disabled>
        <span>
          <strong>Necessários</strong>
          <small>Login, segurança e preferências essenciais.</small>
        </span>
      </label>

      <label class="cookie-consent__option">
        <input
          v-model="granularPreferences.analytics"
          data-testid="cookie-analytics"
          type="checkbox"
        >
        <span>
          <strong>Analytics e performance</strong>
          <small>Métricas de uso, estabilidade e Core Web Vitals.</small>
        </span>
      </label>

      <label class="cookie-consent__option">
        <input
          v-model="granularPreferences.marketing"
          data-testid="cookie-marketing"
          type="checkbox"
        >
        <span>
          <strong>Marketing</strong>
          <small>Campanhas, atribuição e comunicação personalizada.</small>
        </span>
      </label>
    </div>

    <div class="cookie-consent__actions">
      <button
        data-testid="cookie-reject-optional"
        type="button"
        class="cookie-consent__button cookie-consent__button--ghost"
        @click="rejectOptional"
      >
        Rejeitar opcionais
      </button>
      <button
        v-if="!isConfiguring"
        data-testid="cookie-configure"
        type="button"
        class="cookie-consent__button cookie-consent__button--secondary"
        @click="isConfiguring = true"
      >
        Configurar
      </button>
      <button
        v-else
        data-testid="cookie-save-preferences"
        type="button"
        class="cookie-consent__button cookie-consent__button--secondary"
        @click="saveGranularPreferences"
      >
        Salvar preferências
      </button>
      <button
        data-testid="cookie-accept-all"
        type="button"
        class="cookie-consent__button cookie-consent__button--primary"
        @click="acceptAll"
      >
        Aceitar todos
      </button>
    </div>
  </section>
</template>

<style scoped>
.cookie-consent {
  position: fixed;
  right: clamp(16px, 3vw, 32px);
  bottom: clamp(16px, 3vw, 32px);
  z-index: 80;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  width: min(920px, calc(100vw - 32px));
  padding: 22px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(145deg, rgba(18, 26, 42, 0.98), rgba(10, 16, 28, 0.98));
  box-shadow: var(--shadow-lg);
}

.cookie-consent__content {
  min-width: 0;
}

.cookie-consent__eyebrow {
  margin: 0 0 8px;
  color: var(--color-brand-400);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0;
  text-transform: uppercase;
}

.cookie-consent__title {
  margin: 0;
  font-size: var(--font-size-2xl);
  line-height: 1.2;
}

.cookie-consent__text {
  max-width: 620px;
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-body-md);
}

.cookie-consent__policy {
  display: inline-flex;
  margin-top: 10px;
  color: var(--color-brand-400);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.cookie-consent__preferences {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.cookie-consent__option {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--color-outline-subtle);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.03);
  color: var(--color-text-primary);
}

.cookie-consent__option input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: var(--color-brand-500);
}

.cookie-consent__option strong,
.cookie-consent__option small {
  display: block;
}

.cookie-consent__option strong {
  font-size: var(--font-size-sm);
}

.cookie-consent__option small {
  margin-top: 4px;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  line-height: 1.4;
}

.cookie-consent__option--disabled {
  opacity: 0.75;
}

.cookie-consent__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}

.cookie-consent__button {
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-weight: var(--font-weight-bold);
  transition: background var(--motion-fast), border-color var(--motion-fast), color var(--motion-fast);
}

.cookie-consent__button--ghost {
  border-color: var(--color-outline-subtle);
  background: transparent;
  color: var(--color-text-secondary);
}

.cookie-consent__button--secondary {
  border-color: var(--color-outline-soft);
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-primary);
}

.cookie-consent__button--primary {
  background: var(--color-brand-500);
  color: #03131c;
}

.cookie-consent__button:hover {
  border-color: var(--color-brand-400);
}

@media (max-width: 760px) {
  .cookie-consent {
    grid-template-columns: 1fr;
    padding: 18px;
  }

  .cookie-consent__preferences {
    grid-template-columns: 1fr;
  }

  .cookie-consent__actions {
    justify-content: stretch;
  }

  .cookie-consent__button {
    flex: 1 1 100%;
  }
}
</style>
