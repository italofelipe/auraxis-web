<script setup lang="ts">
import { Mail } from "lucide-vue-next";
import { NButton, NAlert } from "naive-ui";
import { useResendConfirmationMutation } from "~/features/auth/queries/use-resend-confirmation-mutation";

const { t } = useI18n();

useSeoMeta({
  title: t("pages.resendConfirmation.meta.title"),
  description: t("pages.resendConfirmation.meta.description"),
});

const mutation = useResendConfirmationMutation();

/**
 * Triggers the resend-confirmation mutation when the user clicks the button.
 */
const handleResend = (): void => {
  mutation.mutate(undefined);
};
</script>

<template>
  <div class="resend-confirmation">
    <div class="resend-confirmation__card">
      <Mail class="resend-confirmation__icon" :size="64" />
      <h1>{{ $t('pages.resendConfirmation.title') }}</h1>
      <p>{{ $t('pages.resendConfirmation.description') }}</p>

      <NAlert
        v-if="mutation.isSuccess.value"
        type="success"
        :show-icon="true"
      >
        {{ $t('pages.resendConfirmation.sent') }}
      </NAlert>

      <NAlert
        v-if="mutation.isError.value"
        type="error"
        :show-icon="true"
      >
        {{ mutation.error.value?.message ?? $t('pages.resendConfirmation.error') }}
      </NAlert>

      <NButton
        type="primary"
        :loading="mutation.isPending.value"
        :disabled="mutation.isPending.value || mutation.isSuccess.value"
        @click="handleResend"
      >
        {{ $t('pages.resendConfirmation.cta') }}
      </NButton>

      <NButton type="default" tag="a" href="/dashboard" size="small">
        {{ $t('pages.resendConfirmation.skip') }}
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.resend-confirmation {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--space-4);
}

.resend-confirmation__card {
  text-align: center;
  max-width: 480px;
  display: grid;
  gap: var(--space-3);
  justify-items: center;
}

.resend-confirmation__icon {
  color: var(--color-brand-500);
}

.resend-confirmation__card h1 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-lg);
}

.resend-confirmation__card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
</style>
