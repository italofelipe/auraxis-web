<script setup lang="ts">
import type { UiSocialAuthButtonsProps, UiSocialAuthButtonsEmits } from "./UiSocialAuthButtons.types";

const props = withDefaults(defineProps<UiSocialAuthButtonsProps>(), {
  disabled: false,
  compact: false,
});

const emit = defineEmits<UiSocialAuthButtonsEmits>();
</script>

<template>
  <div class="ui-social-auth" :class="{ 'ui-social-auth--compact': props.compact }">
    <button
      type="button"
      class="ui-social-auth__btn ui-social-auth__btn--google"
      :disabled="props.disabled"
      :aria-label="props.compact ? 'Entrar com Google' : undefined"
      @click="emit('google-click')"
    >
      <!-- Google icon (SVG inline) -->
      <svg
        class="ui-social-auth__icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      <span v-if="!props.compact" class="ui-social-auth__label">Continuar com Google</span>
    </button>

    <button
      type="button"
      class="ui-social-auth__btn ui-social-auth__btn--apple"
      :disabled="props.disabled"
      :aria-label="props.compact ? 'Entrar com Apple' : undefined"
      @click="emit('apple-click')"
    >
      <!-- Apple icon (SVG inline) -->
      <svg
        class="ui-social-auth__icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        fill="currentColor"
      >
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
      <span v-if="!props.compact" class="ui-social-auth__label">Continuar com Apple</span>
    </button>
  </div>
</template>

<style scoped>
.ui-social-auth {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.ui-social-auth__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  min-height: 44px;
  padding: 10px var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-outline-soft);
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-body);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
}

.ui-social-auth__btn:hover:not(:disabled) {
  background: var(--color-bg-surface);
  border-color: var(--color-outline-medium);
}

.ui-social-auth__btn:focus-visible {
  outline: 2px solid var(--color-brand-600);
  outline-offset: 2px;
}

.ui-social-auth__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ui-social-auth__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.ui-social-auth__label {
  line-height: 1;
}

/* Compact: icon-only, square */
.ui-social-auth--compact {
  flex-direction: row;
}

.ui-social-auth--compact .ui-social-auth__btn {
  width: 44px;
  padding: 10px;
  flex: 1;
}
</style>
