<script setup lang="ts">
import { NButton, NFormItem, NInput } from "naive-ui";
import { ref } from "vue";

import { useInviteMutation } from "~/features/sharing/queries/use-invite-mutation";

/**
 * Form for inviting a user by email.
 *
 * Calls useInviteMutation on submit and resets the input on success.
 */

const email = ref("");
const inviteMutation = useInviteMutation();

/**
 * Submits the invite form by calling the mutation with the entered email.
 * Resets the email field on success.
 */
const handleSubmit = (): void => {
  if (!email.value.trim()) { return; }
  inviteMutation.mutate(
    { inviteeEmail: email.value.trim() },
    {
      onSuccess: () => {
        email.value = "";
      },
    },
  );
};
</script>

<template>
  <form class="invite-form" @submit.prevent="handleSubmit">
    <NFormItem :label="$t('sharing.inviteForm.emailLabel')" class="invite-form__field">
      <NInput
        v-model:value="email"
        type="text"
        :placeholder="$t('sharing.inviteForm.emailPlaceholder')"
        :disabled="inviteMutation.isPending.value"
        data-testid="invite-email-input"
      />
    </NFormItem>
    <NButton
      type="primary"
      :loading="inviteMutation.isPending.value"
      :disabled="!email.trim()"
      attr-type="submit"
      data-testid="invite-submit-button"
    >
      {{ $t('sharing.inviteForm.submit') }}
    </NButton>
    <p v-if="inviteMutation.isError.value" class="invite-form__error">
      {{ $t('sharing.inviteForm.error') }}
    </p>
  </form>
</template>

<style scoped>
.invite-form {
  display: flex;
  align-items: flex-end;
  gap: var(--space-3, 12px);
  flex-wrap: wrap;
}

.invite-form__field {
  flex: 1 1 240px;
  margin-bottom: 0;
}

.invite-form__error {
  width: 100%;
  margin: var(--space-1, 4px) 0 0;
  color: var(--color-error, #d03050);
  font-size: var(--font-size-body-sm, 0.75rem);
}
</style>
