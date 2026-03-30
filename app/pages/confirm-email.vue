<script setup lang="ts">
import { CheckCircle2, XCircle } from "lucide-vue-next";
import { NButton, NSpin } from "naive-ui";
import { useConfirmEmailMutation } from "~/features/auth/queries/use-confirm-email-mutation";

const { t } = useI18n();
const route = useRoute();

useSeoMeta({
  title: t("pages.confirmEmail.meta.title"),
  description: t("pages.confirmEmail.meta.description"),
});

const mutation = useConfirmEmailMutation();

const token = computed(() => {
  const raw = route.query.token;
  return typeof raw === "string" ? raw : null;
});

// Auto-confirm on mount if a token is present in the URL.
onMounted(() => {
  if (token.value) {
    mutation.mutate(token.value);
  }
});

const status = computed((): "idle" | "pending" | "success" | "error" => {
  if (mutation.isPending.value) { return "pending"; }
  if (mutation.isSuccess.value) { return "success"; }
  if (mutation.isError.value) { return "error"; }
  return token.value ? "pending" : "idle";
});
</script>

<template>
  <div class="confirm-email">
    <div class="confirm-email__card">
      <!-- Loading -->
      <template v-if="status === 'pending'">
        <NSpin :size="48" />
        <h1>{{ $t('pages.confirmEmail.confirming') }}</h1>
        <p>{{ $t('pages.confirmEmail.wait') }}</p>
      </template>

      <!-- Success -->
      <template v-else-if="status === 'success'">
        <CheckCircle2 class="confirm-email__icon confirm-email__icon--success" :size="64" />
        <h1>{{ $t('pages.confirmEmail.successTitle') }}</h1>
        <p>{{ $t('pages.confirmEmail.successDescription') }}</p>
        <NButton type="primary" tag="a" href="/dashboard">
          {{ $t('pages.confirmEmail.cta') }}
        </NButton>
      </template>

      <!-- Error -->
      <template v-else-if="status === 'error'">
        <XCircle class="confirm-email__icon confirm-email__icon--error" :size="64" />
        <h1>{{ $t('pages.confirmEmail.errorTitle') }}</h1>
        <p>{{ $t('pages.confirmEmail.errorDescription') }}</p>
        <NButton type="default" tag="a" href="/resend-confirmation">
          {{ $t('pages.confirmEmail.resendCta') }}
        </NButton>
      </template>

      <!-- No token -->
      <template v-else>
        <XCircle class="confirm-email__icon confirm-email__icon--muted" :size="64" />
        <h1>{{ $t('pages.confirmEmail.noTokenTitle') }}</h1>
        <p>{{ $t('pages.confirmEmail.noTokenDescription') }}</p>
        <NButton type="default" tag="a" href="/resend-confirmation">
          {{ $t('pages.confirmEmail.resendCta') }}
        </NButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.confirm-email {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--space-4);
}

.confirm-email__card {
  text-align: center;
  max-width: 480px;
  display: grid;
  gap: var(--space-3);
  justify-items: center;
}

.confirm-email__card h1 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-lg);
}

.confirm-email__card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.confirm-email__icon--success {
  color: var(--color-positive);
}

.confirm-email__icon--error {
  color: var(--color-negative);
}

.confirm-email__icon--muted {
  color: var(--color-text-muted);
}
</style>
