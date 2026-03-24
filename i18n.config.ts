export default defineI18nConfig(() => {
  // Import messages inline to ensure they're available in SSR context
  const pt = {
    nav: {
      dashboard: "Dashboard",
      portfolio: "Carteira",
      goals: "Metas",
      alerts: "Alertas",
      simulations: "Simulações",
      sharedEntries: "Lançamentos Compartilhados",
      tools: "Ferramentas",
      subscription: "Assinatura",
    },
    user: {
      fallbackName: "Usuário",
      accountDescription: "Minha conta",
    },
    auth: {
      login: {
        title: "Bem-vindo de volta",
        subtitle: "Faça login em sua conta para continuar",
        divider: "Ou continue com",
        emailLabel: "Email",
        emailPlaceholder: "seu@email.com",
        passwordLabel: "Senha",
        passwordPlaceholder: "••••••••",
        forgotPassword: "Esqueceu sua senha?",
        submit: "Entrar",
        submitLoading: "Entrando...",
        noAccount: "Não tem uma conta?",
        createAccount: "Criar conta",
      },
    },
  };

  const en = {
    nav: {
      dashboard: "Dashboard",
      portfolio: "Portfolio",
      goals: "Goals",
      alerts: "Alerts",
      simulations: "Simulations",
      sharedEntries: "Shared Entries",
      tools: "Tools",
      subscription: "Subscription",
    },
    user: {
      fallbackName: "User",
      accountDescription: "My account",
    },
    auth: {
      login: {
        title: "Welcome back",
        subtitle: "Sign in to your account to continue",
        divider: "Or continue with",
        emailLabel: "Email",
        emailPlaceholder: "your@email.com",
        passwordLabel: "Password",
        passwordPlaceholder: "••••••••",
        forgotPassword: "Forgot your password?",
        submit: "Sign in",
        submitLoading: "Signing in...",
        noAccount: "Don't have an account?",
        createAccount: "Create one",
      },
    },
  };

  return {
    legacy: false,
    locale: "pt",
    fallbackLocale: "pt",
    messages: {
      pt,
      "pt-BR": pt,
      en,
      "en-US": en,
    },
  };
});
