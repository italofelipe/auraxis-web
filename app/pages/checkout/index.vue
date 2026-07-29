<script setup lang="ts">
import { ArrowRight } from "lucide-vue-next";

import { useAnalytics } from "~/composables/useAnalytics/useAnalytics";
import { useHttp } from "~/composables/useHttp";
import { createAuthApi } from "~/composables/useAuth";
import { idempotencyHeaders } from "~/core/http/idempotency";
import {
  buildLandingCheckoutPath,
  LANDING_CHECKOUT_GENERIC_ERROR,
  buildExistingAccountLoginUrl,
  checkLandingPassword,
  LANDING_PASSWORD_MIN_LENGTH,
  LANDING_CHECKOUT_PLANS,
  resolveLandingCheckoutPlan,
  resolveLandingCheckoutPlanFromSources,
  startLandingCheckout,
  type LandingCheckoutOutcome,
  type LandingCheckoutPlanKey,
} from "~/features/landing/model/landing-checkout";
import {
  LANDING_REGISTER_URL,
  buildAppUrl,
} from "~/features/landing/model/landing-content";

/**
 * Public checkout for the capture landing (#1187).
 *
 * The visitor picks a plan, creates the account here and goes straight to the
 * AbacatePay hosted checkout — the purchase never bounces through the product
 * app first. On the app surface this route is not part of the journey, so it
 * hands over to the in-app subscription screen.
 */
// `public` layout keeps the app chrome (sidebar, authenticated data fetching)
// out of a page that anonymous visitors reach; on the landing surface that
// layout renders nothing but the slot.
definePageMeta({ layout: "public", publicChrome: false });

const config = useRuntimeConfig();
const isLandingSurface = computed(
  (): boolean => config.public.siteSurface === "landing",
);

// Resolved here, in the setup scope, and NOT inside `submit()`: `useHttp()`
// pulls in `useRuntimeConfig`, the session store, `useToast`, `useDialog` and
// `useI18n`, all of which need an active setup context. Called from a click
// handler it threw before any request left the browser and the button froze
// on "Preparando…" (#1198).
const http = useHttp();
const authApi = createAuthApi(http);
// Same setup-scope rule as useHttp (#1198): useAnalytics resolves the Nuxt
// context and must never be called inside the click handler.
const analytics = useAnalytics();

const route = useRoute();

// Prerendered HTML has no query string; the plan is resolved again on the
// client so a shared link like ?plano=mensal still selects the right plan.
const selectedPlan = ref<LandingCheckoutPlanKey>(
  resolveLandingCheckoutPlan(route.query["plano"]),
);
/**
 * URL the browser actually navigated to.
 *
 * Measured on a production build: when `onMounted` runs, `route.query` AND
 * `window.location.search` are both empty because Nuxt strips the query while
 * normalising the route during hydration. This entry keeps the original URL
 * (#1203) — same reason `pages/confirm-email.vue` reads it.
 *
 * @returns The navigation URL, or null when unavailable.
 */
const readNavigationUrl = (): string | null => {
  const entry = performance.getEntriesByType("navigation")[0];
  return entry && "name" in entry ? entry.name : null;
};

onMounted((): void => {
  selectedPlan.value = resolveLandingCheckoutPlanFromSources(
    route.query["plano"],
    window.location.search,
    readNavigationUrl(),
  );
  if (!isLandingSurface.value) {
    void navigateTo("/subscription");
  }
});

const plan = computed(() => LANDING_CHECKOUT_PLANS[selectedPlan.value]);

const name = ref("");
const email = ref("");
const password = ref("");
const acceptedTerms = ref(false);
const isSubmitting = ref(false);
/**
 * Set once the provider checkout URL is known: the browser is about to leave
 * the page, so the button must stay busy instead of flickering back to its
 * idle label while the navigation happens.
 */
const isRedirecting = ref(false);
const errorMessage = ref("");
const accountExists = ref(false);

/** Tempo de leitura do aviso antes de levar para o login (#1243). */
const EXISTING_ACCOUNT_REDIRECT_DELAY_MS = 2500;

/** Whether the form is working — submitting or handing over to the provider. */
const isBusy = computed(
  (): boolean => isSubmitting.value || isRedirecting.value,
);

// A API recusa senha fora da política com um 400 sem detalhes (#1241), então o
// formulário precisa cobrar os requisitos aqui — senão a pessoa só descobre o
// problema como "erro ao processar" depois de submeter.
const passwordCheck = computed(() => checkLandingPassword(password.value));
const passwordHint = computed((): string =>
  passwordCheck.value.valid || password.value.length === 0
    ? `Use ${LANDING_PASSWORD_MIN_LENGTH} caracteres ou mais, com maiúscula, número e símbolo.`
    : `Falta: ${passwordCheck.value.missing.join(", ")}.`,
);

const canSubmit = computed(
  (): boolean =>
    name.value.trim().length > 1 &&
    email.value.trim().includes("@") &&
    passwordCheck.value.valid &&
    acceptedTerms.value &&
    !isBusy.value,
);

/**
 * Switches the plan and mirrors it into the URL so the choice survives a
 * reload and stays shareable.
 *
 * @param key Plan the visitor picked.
 */
const selectPlan = (key: LandingCheckoutPlanKey): void => {
  selectedPlan.value = key;
  void navigateTo(buildLandingCheckoutPath(key), { replace: true });
};

/**
 * Arms the busy state, clears previous feedback and emits the funnel intent
 * pair — captured before any await so a slow network never loses the click
 * (#1208, wiki MVP-1-PostHog-Conversion-Funnel).
 */
const beginSubmit = (): void => {
  isSubmitting.value = true;
  errorMessage.value = "";
  accountExists.value = false;
  analytics.capture("checkout_form_submitted", { plan_slug: selectedPlan.value });
  analytics.capture("upgrade_clicked", {
    source: "landing-checkout",
    plan_slug: selectedPlan.value,
  });
};

/**
 * Emits the funnel event matching a checkout outcome (#1208). The redirect
 * event fires before `window.location` is written — after that assignment no
 * JavaScript is guaranteed to run on this document.
 *
 * @param outcome Result returned by the checkout orchestration.
 */
const captureOutcome = (outcome: LandingCheckoutOutcome): void => {
  if (outcome.status === "redirect") {
    analytics.capture("checkout_provider_redirected", { plan_slug: selectedPlan.value });
    return;
  }
  if (outcome.status === "account-exists") {
    analytics.capture("checkout_account_exists", { plan_slug: selectedPlan.value });
    return;
  }
  analytics.capture("checkout_failed", {
    plan_slug: selectedPlan.value,
    reason: "outcome",
  });
};

/**
 * Avisa que a conta já existe e leva a pessoa para o login do app.
 *
 * Quem já tem cadastro não deveria recomeçar do zero (#1243). O login reconhece
 * a vinda pelo `?motivo` e retoma o plano depois da autenticação. O intervalo
 * curto existe para a pessoa ler o que aconteceu — sair da tela sem explicação
 * passa sensação de erro.
 */
const handleExistingAccount = (): void => {
  accountExists.value = true;
  isRedirecting.value = true;
  const destination = buildExistingAccountLoginUrl(selectedPlan.value);
  window.setTimeout(() => {
    window.location.href = destination;
  }, EXISTING_ACCOUNT_REDIRECT_DELAY_MS);
};

/**
 * Creates the account and hands the visitor over to the payment provider.
 *
 * Wires the page to the pure orchestration in `landing-checkout`, which never
 * throws — every failure comes back as an outcome to render. The `catch` is
 * there for everything else: a broken wiring or a runtime error must show a
 * message, never leave the button stuck on "Preparando…" (#1198).
 *
 * @returns Resolves once the outcome has been applied to the page state.
 */
const submit = async (): Promise<void> => {
  if (!canSubmit.value) {
    return;
  }
  beginSubmit();

  try {
    const outcome = await startLandingCheckout(
      {
        name: name.value,
        email: email.value,
        password: password.value,
        plan: selectedPlan.value,
      },
      {
        register: (input) => authApi.register(input),
        login: async (input) => {
          const session = await authApi.login(input);
          return { token: session.accessToken };
        },
        createCheckoutSession: async ({ token, planSlug }) => {
          const response = await http.post<{
            data?: { checkout_url?: string };
            checkout_url?: string;
          }>(
            "/subscriptions/checkout",
            { plan_slug: planSlug, return_surface: "landing" },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                // Required by the API on this endpoint — without it the
                // purchase dies on a 400 (#1200).
                ...idempotencyHeaders("landing-checkout"),
              },
            },
          );
          const body = response.data;
          return {
            checkoutUrl: body.data?.checkout_url ?? body.checkout_url ?? "",
          };
        },
      },
    );

    captureOutcome(outcome);

    if (outcome.status === "redirect") {
      // Full navigation: the provider checkout lives on another origin. The
      // button stays busy through `isRedirecting` until the browser leaves.
      isRedirecting.value = true;
      window.location.href = outcome.url;
      return;
    }

    if (outcome.status === "account-exists") {
      handleExistingAccount();
      return;
    }
    errorMessage.value = outcome.message;
  } catch {
    analytics.capture("checkout_failed", {
      plan_slug: selectedPlan.value,
      reason: "exception",
    });
    errorMessage.value = LANDING_CHECKOUT_GENERIC_ERROR;
  } finally {
    isSubmitting.value = false;
  }
};

useSeoMeta({
  title: "Assinar o Auraxis",
  description:
    "Escolha o plano, crie sua conta e comece a usar o Auraxis Premium.",
  robots: "noindex, nofollow",
});
</script>

<template>
  <main class="landing checkout" data-testid="landing-checkout">
    <div class="checkout__inner">
      <a class="checkout__back" href="/">← Voltar para a página inicial</a>

      <h1 class="checkout__title">Falta pouco para começar.</h1>
      <p class="checkout__lead">
        Você tem 7 dias grátis. A cobrança só acontece depois desse período, e
        dá para cancelar quando quiser.
      </p>

      <div class="checkout__grid">
        <section class="checkout__summary" aria-label="Plano escolhido">
          <p class="checkout__summary-kicker">Plano escolhido</p>
          <h2 class="checkout__plan-name">{{ plan.name }}</h2>
          <p class="checkout__price">
            <span class="checkout__amount">{{ plan.price }}</span>
            <span class="checkout__period">{{ plan.period }}</span>
          </p>
          <p class="checkout__note">{{ plan.note }}</p>

          <div class="checkout__switch">
            <button
              v-for="option in LANDING_CHECKOUT_PLANS"
              :key="option.key"
              type="button"
              class="checkout__switch-button"
              :class="{
                'checkout__switch-button--active': option.key === plan.key,
              }"
              :aria-pressed="option.key === plan.key"
              :data-testid="`landing-checkout-plan-${option.key}`"
              @click="selectPlan(option.key)"
            >
              {{ option.name }}
            </button>
          </div>
        </section>

        <section class="checkout__form-card" aria-label="Seus dados">
          <form class="checkout__form" novalidate @submit.prevent="submit">
            <label class="checkout__field">
              <span>Nome</span>
              <input
                v-model="name"
                type="text"
                autocomplete="name"
                required
                data-testid="landing-checkout-name"
              >
            </label>

            <label class="checkout__field">
              <span>Email</span>
              <input
                v-model="email"
                type="email"
                autocomplete="email"
                required
                data-testid="landing-checkout-email"
              >
            </label>

            <label class="checkout__field">
              <span>Senha</span>
              <input
                v-model="password"
                type="password"
                autocomplete="new-password"
                minlength="8"
                required
                data-testid="landing-checkout-password"
              >
              <small
                :class="{ 'checkout__hint--missing': !passwordCheck.valid && password.length > 0 }"
                data-testid="landing-checkout-password-hint"
              >{{ passwordHint }}</small>
            </label>

            <label class="checkout__terms">
              <input
                v-model="acceptedTerms"
                type="checkbox"
                data-testid="landing-checkout-terms"
              >
              <span>
                Li e aceito os
                <a :href="buildAppUrl('/terms')" target="_blank" rel="noopener">
                  Termos de uso
                </a>
                e a
                <a :href="buildAppUrl('/privacy')" target="_blank" rel="noopener">
                  Política de privacidade
                </a>.
              </span>
            </label>

            <p
              v-if="accountExists"
              class="checkout__alert"
              role="alert"
              data-testid="landing-checkout-account-exists"
            >
              Você já tem cadastro no Auraxis. Estamos levando você para o login —
              é só entrar com seu email e senha para concluir a assinatura.
              <a :href="buildExistingAccountLoginUrl(selectedPlan)">Ir agora</a>.
            </p>

            <p
              v-else-if="errorMessage"
              class="checkout__alert"
              role="alert"
              data-testid="landing-checkout-error"
            >
              {{ errorMessage }}
            </p>

            <button
              type="submit"
              class="checkout__submit"
              :disabled="!canSubmit"
              data-testid="landing-checkout-submit"
            >
              {{ isBusy ? "Preparando…" : "Ir para o pagamento" }}
              <ArrowRight v-if="!isBusy" :size="17" aria-hidden="true" />
            </button>

            <p class="checkout__secondary">
              Prefere olhar antes?
              <a :href="LANDING_REGISTER_URL">Criar conta gratuita</a>
            </p>
          </form>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.checkout {
  min-height: 100vh;
  padding-block: clamp(var(--space-6), 7vw, 88px);
  background: var(--landing-bg);
  color: var(--landing-ink);
}

.checkout__inner {
  display: grid;
  gap: var(--space-4);
  width: min(1040px, calc(100% - 40px));
  margin-inline: auto;
}

.checkout__back {
  color: var(--landing-muted);
  font-size: var(--landing-size-sm);
  text-decoration: none;
  justify-self: start;
}

.checkout__back:hover {
  color: var(--landing-cyan);
}

.checkout__title {
  margin: 0;
  /* Headings inherit a global heading colour that is unreadable on the landing
     dark surface — pin the landing ink explicitly. */
  color: var(--landing-ink);
  font-family: var(--landing-font-display);
  font-size: var(--landing-size-h2);
  font-weight: var(--font-weight-medium);
  line-height: var(--landing-leading-h2);
}

.checkout__lead {
  margin: 0;
  max-width: 58ch;
  color: var(--landing-body);
  font-size: var(--landing-size-lead);
  line-height: var(--landing-leading-body);
}

.checkout__grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.checkout__summary,
.checkout__form-card {
  padding: var(--space-6) var(--space-5);
  border: 1px solid var(--landing-line);
  border-radius: var(--landing-radius-card);
  background: var(--landing-surface);
}

.checkout__summary-kicker {
  margin: 0 0 var(--space-2);
  color: var(--landing-cyan);
  font-size: var(--landing-size-kicker);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--landing-tracking-kicker);
  text-transform: uppercase;
}

.checkout__plan-name {
  margin: 0;
  color: var(--landing-ink);
  font-size: var(--landing-size-h3);
  font-weight: var(--font-weight-semibold);
}

.checkout__price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-1) var(--space-2);
  margin: var(--space-2) 0 0;
}

.checkout__amount {
  color: var(--landing-ink);
  font-family: var(--landing-font-display);
  font-size: var(--landing-size-h2);
  font-weight: var(--font-weight-medium);
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
}

.checkout__period,
.checkout__note {
  color: var(--landing-muted);
  font-size: var(--landing-size-sm);
}

.checkout__note {
  margin: var(--space-2) 0 0;
}

.checkout__switch {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.checkout__switch-button {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--landing-line);
  border-radius: var(--landing-radius-pill);
  background: transparent;
  color: var(--landing-body);
  font-size: var(--landing-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.checkout__switch-button--active {
  border-color: var(--landing-cyan);
  color: var(--landing-ink);
}

.checkout__form {
  display: grid;
  gap: var(--space-3);
}

.checkout__field {
  display: grid;
  gap: var(--space-1);
  font-size: var(--landing-size-sm);
  color: var(--landing-body);
}

.checkout__field input {
  min-height: 46px;
  padding-inline: var(--space-3);
  border: 1px solid var(--landing-line);
  border-radius: var(--radius-sm);
  background: var(--landing-bg);
  color: var(--landing-ink);
  font-size: var(--font-size-md);
}

.checkout__field input:focus-visible {
  outline: 2px solid var(--landing-cyan);
  outline-offset: 1px;
}

.checkout__field small {
  color: var(--landing-muted);
  font-size: var(--landing-size-fine);
}

.checkout__terms {
  display: flex;
  gap: var(--space-2);
  align-items: start;
  color: var(--landing-body);
  font-size: var(--landing-size-sm);
  line-height: var(--landing-leading-body);
}

.checkout__terms a,
.checkout__alert a,
.checkout__secondary a {
  color: var(--landing-cyan);
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* Requisitos ainda não atendidos: destaque sem alarmar — o campo está sendo
   preenchido, não errado. */
.checkout__hint--missing {
  color: #f5c451;
}

.checkout__alert {
  margin: 0;
  padding: var(--space-3);
  border: 1px solid var(--landing-line);
  border-radius: var(--radius-sm);
  color: var(--landing-ink);
  font-size: var(--landing-size-sm);
  line-height: var(--landing-leading-body);
}

.checkout__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 52px;
  border: 0;
  border-radius: var(--landing-radius-pill);
  background: var(--landing-grad);
  color: var(--landing-cyan-ink);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

.checkout__submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.checkout__secondary {
  margin: 0;
  color: var(--landing-muted);
  font-size: var(--landing-size-sm);
  text-align: center;
}

@media (max-width: 860px) {
  .checkout__grid {
    grid-template-columns: 1fr;
  }

  .checkout__inner {
    width: min(1040px, calc(100% - 24px));
  }
}
</style>
