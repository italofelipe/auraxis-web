<script setup lang="ts">
import { NButton, NInput, NModal } from "naive-ui";
import { isApiErrorWithStatus } from "~/core/errors";
import { useDeleteAccountMutation } from "~/features/user/mutations/use-delete-account-mutation";
import { useLogout } from "~/composables/useLogout/useLogout";

const { t } = useI18n();

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Zona de perigo",
  pageSubtitle: "Ações irreversíveis",
});

useHead({ title: "Zona de perigo | Auraxis" });

const { logout } = useLogout();

const showModal = ref(false);
const password = ref("");
const errorMessage = ref<string | null>(null);

const deleteAccountMutation = useDeleteAccountMutation();

const isDisabled = computed(() => password.value.trim().length === 0 || deleteAccountMutation.isPending.value);

/** Opens the delete-account confirmation modal and resets form state. */
function openModal(): void {
  password.value = "";
  errorMessage.value = null;
  showModal.value = true;
}

/** Closes the delete-account confirmation modal and resets form state. */
function cancelModal(): void {
  showModal.value = false;
  password.value = "";
  errorMessage.value = null;
}

/** Submits the account deletion request with the entered password. */
function handleConfirm(): void {
  errorMessage.value = null;
  deleteAccountMutation.mutate(password.value, {
    onSuccess: (): void => {
      showModal.value = false;
      logout();
    },
    onError: (error): void => {
      if (isApiErrorWithStatus(error, 403)) {
        errorMessage.value = t("pages.settings.dangerZone.errorWrongPassword");
      } else {
        errorMessage.value = t("pages.settings.dangerZone.errorGeneric");
      }
    },
  });
}
</script>

<template>
  <div class="danger-zone-page">
    <div class="danger-zone-page__header">
      <div class="danger-zone-page__title-block">
        <span class="danger-zone-page__title">{{ $t('pages.settings.dangerZone.title') }}</span>
        <span class="danger-zone-page__subtitle">{{ $t('pages.settings.dangerZone.deleteWarning') }}</span>
      </div>
    </div>

    <UiSurfaceCard padding="lg" class="danger-zone-page__card">
      <div class="danger-zone-page__content">
        <div class="danger-zone-page__description">
          <span class="danger-zone-page__label">{{ $t('pages.settings.dangerZone.deleteAccount') }}</span>
          <span class="danger-zone-page__warning">{{ $t('pages.settings.dangerZone.deleteWarning') }}</span>
        </div>
        <NButton
          type="error"
          class="danger-zone-page__delete-btn"
          @click="openModal"
        >
          {{ $t('pages.settings.dangerZone.deleteAccount') }}
        </NButton>
      </div>
    </UiSurfaceCard>

    <NModal
      v-model:show="showModal"
      preset="dialog"
      type="error"
      :title="$t('pages.settings.dangerZone.deleteConfirmTitle')"
      :mask-closable="!deleteAccountMutation.isPending.value"
      :close-on-esc="!deleteAccountMutation.isPending.value"
      @close="cancelModal"
    >
      <div class="danger-zone-modal">
        <p class="danger-zone-modal__body">
          {{ $t('pages.settings.dangerZone.deleteConfirmBody') }}
        </p>

        <div class="danger-zone-modal__field">
          <label class="danger-zone-modal__label">
            {{ $t('pages.settings.dangerZone.passwordLabel') }}
          </label>
          <NInput
            v-model:value="password"
            type="password"
            show-password-on="click"
            :placeholder="$t('pages.settings.dangerZone.passwordLabel')"
            :disabled="deleteAccountMutation.isPending.value"
            @keyup.enter="!isDisabled && handleConfirm()"
          />
        </div>

        <p v-if="errorMessage" class="danger-zone-modal__error">
          {{ errorMessage }}
        </p>
      </div>

      <template #action>
        <div class="danger-zone-modal__actions">
          <NButton
            :disabled="deleteAccountMutation.isPending.value"
            @click="cancelModal"
          >
            {{ $t('pages.settings.dangerZone.cancelButton') }}
          </NButton>
          <NButton
            type="error"
            :disabled="isDisabled"
            :loading="deleteAccountMutation.isPending.value"
            @click="handleConfirm"
          >
            {{ $t('pages.settings.dangerZone.confirmButton') }}
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.danger-zone-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
}

.danger-zone-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.danger-zone-page__title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.danger-zone-page__title {
  font-size: var(--font-size-lg, 1.25rem);
  font-weight: var(--font-weight-semibold);
  color: var(--color-negative, #ef4444);
}

.danger-zone-page__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.danger-zone-page__card {
  border: 1px solid var(--color-negative, #ef4444) !important;
}

.danger-zone-page__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.danger-zone-page__description {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.danger-zone-page__label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.danger-zone-page__warning {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  max-width: 480px;
}

.danger-zone-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-2);
}

.danger-zone-modal__body {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  margin: 0;
}

.danger-zone-modal__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.danger-zone-modal__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
}

.danger-zone-modal__error {
  font-size: var(--font-size-sm);
  color: var(--color-negative, #ef4444);
  margin: 0;
}

.danger-zone-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>
