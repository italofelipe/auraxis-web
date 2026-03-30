<script setup lang="ts">
import { computed } from "vue";
import { NButton, useMessage } from "naive-ui";
import { useRouter } from "#app";
import { useSessionStore } from "~/stores/session";
import { useToolContextStore } from "~/stores/toolContext";
import { useSaveSimulationMutation } from "~/features/simulations/queries/use-save-simulation-mutation";

const props = withDefaults(
  defineProps<{
    /** The tool identifier that produced this result. */
    toolSlug: string;
    /** The inputs passed to the tool. */
    inputs: unknown;
    /** The result produced by the tool. */
    result: unknown;
    /** Optional display name for the simulation. Defaults to the tool slug. */
    name?: string;
  }>(),
  {
    name: undefined,
  },
);

const { t } = useI18n();

const router = useRouter();
const message = useMessage();
const sessionStore = useSessionStore();
const toolContextStore = useToolContextStore();
const saveSimulationMutation = useSaveSimulationMutation();

/**
 * Whether the current user is authenticated.
 *
 * @returns True when a valid session is present.
 */
const isAuthenticated = computed<boolean>(() => {
  sessionStore.restore();
  return sessionStore.isAuthenticated;
});

/**
 * The display name used for the simulation.
 * Falls back to the tool slug if no explicit name prop is provided.
 *
 * @returns The simulation name string.
 */
const simulationName = computed<string>(() => props.name ?? props.toolSlug);

/**
 * Handles the save action.
 *
 * When authenticated, calls the save mutation directly and shows a success
 * notification on completion. When not authenticated, saves the current tool
 * context to sessionStorage and redirects to the login page with a restore
 * redirect so the flow can resume after authentication.
 */
const handleSave = (): void => {
  if (isAuthenticated.value) {
    saveSimulationMutation.mutate(
      {
        name: simulationName.value,
        toolSlug: props.toolSlug,
        inputs: props.inputs,
        result: props.result,
      },
      {
        onSuccess: (): void => {
          message.success(t("simulation.saveButton.success"));
        },
        onError: (): void => {
          message.error(t("simulation.saveButton.error"));
        },
      },
    );
    return;
  }

  toolContextStore.save(props.toolSlug, props.result);
  const encodedResult = encodeURIComponent(JSON.stringify(props.result));
  const redirectUrl = `/login?redirect=/tools&tool=${props.toolSlug}&result=${encodedResult}`;
  void router.push(redirectUrl);
};
</script>

<template>
  <NButton
    type="primary"
    size="medium"
    :loading="saveSimulationMutation.isPending.value"
    :disabled="saveSimulationMutation.isPending.value"
    class="save-simulation-button"
    @click="handleSave"
  >
    {{ $t('simulation.saveButton.label') }}
  </NButton>
</template>

<style scoped>
.save-simulation-button {
  border-radius: var(--border-radius-md, var(--n-border-radius));
}
</style>
