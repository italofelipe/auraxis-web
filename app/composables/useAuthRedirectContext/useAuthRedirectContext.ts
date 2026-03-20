const REDIRECT_KEY = "auraxis:auth:redirect";
const FALLBACK_PATH = "/dashboard";

export interface AuthRedirectContext {
  /** Salva a URL atual como destino pós-login. */
  saveRedirect(path: string): void
  /** Consome e retorna o caminho salvo (limpa após leitura). Retorna fallback se não houver nada salvo. */
  consumeRedirect(): string
  /** Lê sem consumir. */
  peekRedirect(): string | null
  /** Remove explicitamente o redirect salvo. */
  clearRedirect(): void
}

/**
 * Composable que gerencia o contexto de redirecionamento pós-autenticação.
 * Persiste em sessionStorage para sobreviver a reloads dentro da mesma aba.
 *
 * MIC-29
 *
 * @returns Conjunto de operações para salvar, consumir e limpar o redirect de auth.
 */
export function useAuthRedirectContext(): AuthRedirectContext {
  const isClient = typeof window !== "undefined";

  /**
   * Salva o caminho de destino pós-login.
   * Caminhos que não iniciam com "/" são ignorados e substituídos pelo fallback.
   * @param path - Caminho absoluto do destino (deve iniciar com "/").
   */
  const saveRedirect = (path: string): void => {
    if (!isClient) {
      return;
    }
    const safe = path.startsWith("/") ? path : FALLBACK_PATH;
    sessionStorage.setItem(REDIRECT_KEY, safe);
  };

  /**
   * Lê e remove o caminho salvo.
   * Retorna o fallback "/dashboard" se nenhum caminho estiver armazenado.
   * @returns O caminho salvo ou "/dashboard" como fallback.
   */
  const consumeRedirect = (): string => {
    if (!isClient) {
      return FALLBACK_PATH;
    }
    const saved = sessionStorage.getItem(REDIRECT_KEY);
    sessionStorage.removeItem(REDIRECT_KEY);
    return saved ?? FALLBACK_PATH;
  };

  /**
   * Lê o caminho salvo sem removê-lo.
   * @returns O caminho salvo ou null se não houver nenhum.
   */
  const peekRedirect = (): string | null => {
    if (!isClient) {
      return null;
    }
    return sessionStorage.getItem(REDIRECT_KEY);
  };

  /**
   * Remove explicitamente o redirect salvo.
   */
  const clearRedirect = (): void => {
    if (!isClient) {
      return;
    }
    sessionStorage.removeItem(REDIRECT_KEY);
  };

  return { saveRedirect, consumeRedirect, peekRedirect, clearRedirect };
}
