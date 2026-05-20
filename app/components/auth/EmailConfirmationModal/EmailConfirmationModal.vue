<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { AlertTriangle, Mail, ShieldCheck } from "lucide-vue-next";
import { NAlert, NButton, NModal } from "naive-ui";
import { useResendConfirmationMutation } from "~/features/auth/queries/use-resend-confirmation-mutation";
import { useSessionStore } from "~/stores/session";

const RESEND_COOLDOWN_SECONDS = 60;
const RESEND_COOLDOWN_MS = RESEND_COOLDOWN_SECONDS * 1000;

const sessionStore = useSessionStore();
const resendMutation = useResendConfirmationMutation();

const dismissed = ref(false);
const now = ref(Date.now());
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const isBlocked = computed(() => sessionStore.emailConfirmationBlocked);
const normalizedEmail = computed(() => sessionStore.userEmail ?? "usuario");
const cooldownKey = computed(() => `auraxis:email-confirmation-resend:${normalizedEmail.value}`);

const maskedEmail = computed((): string => {
  const email = sessionStore.userEmail;
  if (!email) { return ""; }
  const [local, domain] = email.split("@");
  if (!local || !domain) { return email; }
  const visible = local.length > 2 ? local.slice(0, 2) : local[0];
  return `${visible}***@${domain}`;
});

const deadlineLabel = computed((): string | null => {
  if (!sessionStore.emailConfirmationDeadlineAt) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(sessionStore.emailConfirmationDeadlineAt));
});

/**
 * Reads the client-side resend cooldown expiry timestamp.
 *
 * @returns Cooldown expiry timestamp in milliseconds, or 0 when absent.
 */
function readCooldownExpiresAt(): number {
  if (typeof sessionStorage === "undefined") {
    return 0;
  }

  const value = sessionStorage.getItem(cooldownKey.value);
  const parsed = value ? Number(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

const remainingSeconds = computed((): number => {
  const expiresAt = readCooldownExpiresAt();
  return Math.max(0, Math.ceil((expiresAt - now.value) / 1000));
});

const isVisible = computed((): boolean => {
  if (!sessionStore.isAuthenticated || sessionStore.emailConfirmed !== false) {
    return false;
  }

  return isBlocked.value || !dismissed.value;
});

const resendButtonLabel = computed((): string => {
  if (remainingSeconds.value > 0) {
    return `Reenviar em ${remainingSeconds.value}s`;
  }

  return "Reenviar e-mail";
});

/** Starts the visual cooldown ticker for the resend button. */
function startTicker(): void {
  if (countdownTimer) {
    return;
  }

  countdownTimer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
}

/** Dismisses the modal for the current page session when access is not blocked. */
function dismiss(): void {
  if (isBlocked.value) {
    return;
  }

  dismissed.value = true;
}

/** Sends the confirmation email and stores a session cooldown immediately. */
function resendConfirmation(): void {
  if (remainingSeconds.value > 0 || resendMutation.isPending.value) {
    return;
  }

  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(cooldownKey.value, String(Date.now() + RESEND_COOLDOWN_MS));
  }
  now.value = Date.now();
  resendMutation.mutate(undefined);
}

onMounted(startTicker);
onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});
</script>

<template>
  <NModal
    :show="isVisible"
    preset="card"
    class="email-confirmation-modal"
    style="width: min(480px, calc(100vw - 32px)); max-height: min(720px, calc(100vh - 48px)); overflow: auto;"
    :title="isBlocked ? 'Confirme seu e-mail para continuar' : 'Confirme seu e-mail'"
    :mask-closable="!isBlocked"
    :closable="!isBlocked"
    @close="dismiss"
    @update:show="(value) => { if (!value) dismiss(); }"
  >
    <div class="email-confirmation-modal__body">
      <div class="email-confirmation-modal__icon" :class="{ 'email-confirmation-modal__icon--blocked': isBlocked }">
        <AlertTriangle v-if="isBlocked" :size="26" aria-hidden="true" />
        <Mail v-else :size="26" aria-hidden="true" />
      </div>

      <p class="email-confirmation-modal__lead">
        {{ isBlocked
          ? 'Para acessar sua conta é necessário confirmar o e-mail cadastrado.'
          : 'Confirme seu e-mail para proteger o acesso, recuperar sua conta com segurança e receber avisos importantes do Auraxis.' }}
      </p>

      <p v-if="maskedEmail" class="email-confirmation-modal__email">
        Enviamos a confirmação para <strong>{{ maskedEmail }}</strong>.
      </p>

      <NAlert
        v-if="deadlineLabel && !isBlocked"
        type="warning"
        :show-icon="false"
        class="email-confirmation-modal__alert"
      >
        Você pode continuar usando a conta por enquanto. Depois de {{ deadlineLabel }}, será necessário confirmar o e-mail para entrar.
      </NAlert>

      <ul class="email-confirmation-modal__benefits" aria-label="Benefícios de confirmar o e-mail">
        <li>
          <ShieldCheck :size="15" aria-hidden="true" />
          Evita que outra pessoa use seu endereço indevidamente.
        </li>
        <li>
          <ShieldCheck :size="15" aria-hidden="true" />
          Mantém recuperação de senha e alertas de segurança funcionando.
        </li>
      </ul>

      <NAlert
        v-if="resendMutation.isSuccess.value"
        type="success"
        :show-icon="true"
        class="email-confirmation-modal__alert"
      >
        Novo e-mail enviado. Verifique sua caixa de entrada e o spam.
      </NAlert>

      <NAlert
        v-if="resendMutation.isError.value"
        type="error"
        :show-icon="true"
        class="email-confirmation-modal__alert"
      >
        {{ resendMutation.error.value?.message ?? 'Não foi possível reenviar agora. Tente novamente em instantes.' }}
      </NAlert>
    </div>

    <template #footer>
      <div class="email-confirmation-modal__actions">
        <NButton
          data-testid="email-confirmation-resend"
          type="primary"
          :loading="resendMutation.isPending.value"
          :disabled="remainingSeconds > 0 || resendMutation.isPending.value"
          @click="resendConfirmation"
        >
          {{ resendButtonLabel }}
        </NButton>
        <NButton
          v-if="!isBlocked"
          data-testid="email-confirmation-dismiss"
          secondary
          @click="dismiss"
        >
          Agora não
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.email-confirmation-modal {
  width: min(480px, calc(100vw - 32px));
}

:deep(.email-confirmation-modal.n-card) {
  width: min(480px, calc(100vw - 32px));
}

.email-confirmation-modal__body {
  display: grid;
  gap: var(--space-3);
}

.email-confirmation-modal__icon {
  display: inline-grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: var(--radius-full);
  color: var(--color-brand-600);
  background: color-mix(in srgb, var(--color-brand-500) 12%, transparent);
}

.email-confirmation-modal__icon--blocked {
  color: var(--color-warning);
  background: color-mix(in srgb, var(--color-warning) 16%, transparent);
}

.email-confirmation-modal__lead,
.email-confirmation-modal__email {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.55;
}

.email-confirmation-modal__email strong {
  color: var(--color-text-primary);
}

.email-confirmation-modal__benefits {
  display: grid;
  gap: var(--space-2);
  padding: 0;
  margin: 0;
  list-style: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.email-confirmation-modal__benefits li {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
}

.email-confirmation-modal__benefits svg {
  flex: 0 0 auto;
  margin-top: 2px;
  color: var(--color-positive);
}

.email-confirmation-modal__alert {
  margin: 0;
}

.email-confirmation-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

@media (max-width: 520px) {
  .email-confirmation-modal__actions {
    flex-direction: column;
  }
}
</style>
