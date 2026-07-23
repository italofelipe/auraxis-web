<script setup lang="ts">
import { Mail, ShieldCheck, Timer } from "lucide-vue-next";

definePageMeta({ layout: "public" });

useSeoMeta({
  title: "Suporte | Auraxis",
  description:
    "Fale com o suporte do Auraxis: dúvidas sobre conta, assinatura, reembolso, privacidade e dados. Respondemos em até 2 dias úteis.",
  robots: "index, follow",
});

const SUPPORT_EMAIL = "suporte@auraxis.com.br";

const channels = [
  {
    icon: Mail,
    title: "E-mail de suporte",
    text: `Escreva para ${SUPPORT_EMAIL} com o e-mail da sua conta. É o canal oficial para dúvidas, cobrança e pedidos de privacidade (LGPD).`,
  },
  {
    icon: Timer,
    title: "Prazo de resposta",
    text: "Respondemos em até 2 dias úteis. Pedidos de titular de dados (LGPD) seguem os prazos legais aplicáveis.",
  },
  {
    icon: ShieldCheck,
    title: "Segurança",
    text: "Nunca pedimos sua senha, código de verificação ou dados de cartão por e-mail. Desconfie de mensagens em nome do Auraxis que peçam isso.",
  },
] as const;

const faqItems = [
  {
    question: "Como cancelo minha assinatura Premium?",
    answer:
      "Em Configurações → Assinatura, a qualquer momento. O acesso Premium continua ativo até o fim do período já pago e não há cobrança no ciclo seguinte.",
  },
  {
    question: "Posso pedir reembolso?",
    answer:
      "Sim, dentro de 7 dias corridos da primeira contratação (direito de arrependimento, art. 49 do CDC): reembolso integral. Envie o pedido para suporte@auraxis.com.br. Após esse prazo, não há reembolso proporcional, salvo hipóteses previstas em lei.",
  },
  {
    question: "Como excluo minha conta e meus dados?",
    answer:
      "Em Configurações → Zona de risco, com confirmação de senha. Os dados de produto são removidos ou anonimizados, mantendo apenas retenções mínimas exigidas por lei. O processo é imediato e irreversível.",
  },
  {
    question: "Como exporto meus dados (portabilidade)?",
    answer:
      "Você pode solicitar uma cópia dos seus dados pela Central de Privacidade (Configurações → Privacidade) ou pelo e-mail de suporte, conforme a LGPD.",
  },
  {
    question: "O Auraxis guarda os dados do meu cartão?",
    answer:
      "Não. O pagamento é processado pela AbacatePay (provedor brasileiro) em checkout hospedado — número de cartão, CVV e credenciais bancárias nunca passam pelos servidores do Auraxis.",
  },
  {
    question: "Quanto custa o Premium?",
    answer:
      "R$ 29,90/mês ou R$ 287,04/ano (equivalente a R$ 23,92/mês). Há trial de 7 dias no primeiro cadastro elegível e o plano Free continua disponível sem custo.",
  },
  {
    question: "A IA usa meus dados para treinar modelos?",
    answer:
      "Não. Os dados do usuário não treinam modelos próprios nem de terceiros. Os insights são gerados sob demanda, com o mínimo necessário, e são informativos — não constituem recomendação financeira.",
  },
  {
    question: "Esqueci minha senha. E agora?",
    answer:
      "Use a opção \"Esqueci minha senha\" na tela de login para receber o link de redefinição no seu e-mail cadastrado.",
  },
] as const;
</script>

<template>
  <div class="support-page">
    <section class="support-page__hero">
      <h1 class="support-page__title">Suporte</h1>
      <p class="support-page__lead">
        Estamos aqui para ajudar com a sua conta, assinatura e dados.
      </p>
      <a
        class="support-page__cta"
        :href="`mailto:${SUPPORT_EMAIL}`"
        data-testid="support-email-cta"
      >
        <Mail :size="18" aria-hidden="true" />
        {{ SUPPORT_EMAIL }}
      </a>
    </section>

    <section class="support-page__channels" aria-label="Canais e prazos de atendimento">
      <article v-for="channel in channels" :key="channel.title" class="support-page__channel">
        <component :is="channel.icon" :size="22" class="support-page__channel-icon" aria-hidden="true" />
        <h2 class="support-page__channel-title">{{ channel.title }}</h2>
        <p class="support-page__channel-text">{{ channel.text }}</p>
      </article>
    </section>

    <section class="support-page__faq" aria-label="Perguntas frequentes">
      <h2 class="support-page__faq-title">Perguntas frequentes</h2>
      <details v-for="item in faqItems" :key="item.question" class="support-page__faq-item">
        <summary class="support-page__faq-question">{{ item.question }}</summary>
        <p class="support-page__faq-answer">{{ item.answer }}</p>
      </details>
    </section>

    <section class="support-page__legal">
      <p>
        Documentos:
        <NuxtLink to="/terms">Termos de Uso</NuxtLink> ·
        <NuxtLink to="/privacy">Política de Privacidade</NuxtLink> ·
        <NuxtLink to="/cookies">Política de Cookies</NuxtLink>
      </p>
    </section>
  </div>
</template>

<style scoped>
.support-page {
  max-width: 880px;
  margin-inline: auto;
  padding: var(--space-6) var(--space-4) var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.support-page__hero {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.support-page__title {
  margin: 0;
  font-size: var(--font-size-4xl);
  color: var(--color-text-primary);
}

.support-page__lead {
  margin: 0;
  max-width: 52ch;
  color: var(--color-text-secondary);
}

.support-page__cta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  background: var(--gradient-brand);
  color: #ffffff;
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
}

.support-page__channels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
}

.support-page__channel {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.support-page__channel-icon {
  color: var(--color-brand-500);
}

.support-page__channel-title {
  margin: var(--space-2) 0;
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
}

.support-page__channel-text {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.support-page__faq-title {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-2xl);
  color: var(--color-text-primary);
}

.support-page__faq-item {
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-2);
}

.support-page__faq-question {
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.support-page__faq-question:focus-visible {
  outline: 2px solid var(--color-brand-500);
  outline-offset: 2px;
}

.support-page__faq-answer {
  margin: var(--space-3) 0 0;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.support-page__legal {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.support-page__legal a {
  color: var(--color-brand-500);
}
</style>
