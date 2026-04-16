<script setup lang="ts">
import { provide, toRef } from "vue";
import { NModal } from "naive-ui";

import type {
  ProfileCompletionModalProps,
  ProfileCompletionModalEmits,
} from "./ProfileCompletionModal.types";
import ProfileCompletionModalFields from "./ProfileCompletionModalFields.vue";
import {
  PROFILE_COMPLETION_FORM_KEY,
  useProfileCompletionForm,
} from "./useProfileCompletionForm";

const props = defineProps<ProfileCompletionModalProps>();
const emit = defineEmits<ProfileCompletionModalEmits>();

const form = useProfileCompletionForm({
  open: toRef(props, "open"),
  emit,
});
provide(PROFILE_COMPLETION_FORM_KEY, form);

const { isPending, onSubmit } = form;
</script>

<template>
  <NModal
    :show="props.open"
    :mask-closable="false"
    class="profile-modal"
    transform-origin="center"
    @update:show="(v) => { if (!v) emit('close'); }"
  >
    <div class="profile-modal__container">
      <div class="profile-modal__header">
        <div>
          <h2 class="profile-modal__title">{{ $t('pages.profile.modal.title') }}</h2>
          <p class="profile-modal__subtitle">{{ $t('pages.profile.modal.subtitle') }}</p>
        </div>
        <button
          class="profile-modal__close"
          type="button"
          :aria-label="$t('pages.profile.modal.closeAriaLabel')"
          @click="emit('close')"
        >✕</button>
      </div>

      <form class="profile-modal__form" novalidate @submit.prevent="onSubmit">
        <ProfileCompletionModalFields />

        <div class="profile-modal__actions">
          <button
            type="button"
            class="profile-modal__btn-secondary"
            :disabled="isPending"
            @click="emit('close')"
          >
            {{ $t('pages.profile.modal.actions.postpone') }}
          </button>

          <button
            type="submit"
            class="profile-modal__btn-primary"
            :disabled="isPending"
            :aria-busy="isPending"
          >
            <span v-if="isPending" class="profile-modal__spinner" aria-hidden="true" />
            {{ isPending ? $t('pages.profile.modal.actions.saving') : $t('pages.profile.modal.actions.update') }}
          </button>
        </div>
      </form>
    </div>
  </NModal>
</template>

<style scoped src="./profile-modal.css"></style>
