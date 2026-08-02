import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import ImportFinishLaterModal from "./ImportFinishLaterModal.vue";
import ImportRejectedRowsPanel from "./ImportRejectedRowsPanel.vue";
import ImportReviewModal from "./ImportReviewModal.vue";
import type { ImportReviewCard } from "~/features/import/composables/useImportReview";
import type { ImportTransactionDraft } from "~/features/import/model/import";

// Os textos literais da especificação são o objeto do teste, então o `t` aqui
// devolve o valor real do pt.json em vez da chave.
const MESSAGES: Record<string, string> = {
  "import.review.modalTitle":
    "Antes de prosseguir, precisamos conferir se as informações estão corretas",
  "import.review.modalDescription": "Alguns lançamentos vieram sem dados no arquivo.",
  "import.review.askDescription": "Qual o título desta transação?",
  "import.review.askAmount": "Qual o valor desta transação?",
  "import.review.blockedHint":
    "Conclua o preenchimento das transações pendentes para liberar a importação.",
  "import.review.finishNow": "Concluir importação",
  "import.review.finishLater": "Terminar depois",
  "import.review.income": "Receita",
  "import.review.expense": "Despesa",
  "import.review.resolved": "Preenchida",
  "import.review.missing": "Falta preencher",
  "import.finishLater.title":
    "Caso queira terminar de cadastrar suas transações posteriormente nós vamos cadastrar os dados com informações genéricas que podem ser alteradas por você posteriormente",
  "import.finishLater.confirm": "Prosseguir",
  "import.finishLater.cancel": "Não, quero terminar de preencher meus dados",
  "import.rejectedRows.description":
    "O arquivo tinha linhas que não conseguimos ler. Corrija e importe de novo.",
  "import.rejectedRows.expand": "Ver quais linhas",
};

/**
 * Tradutor de teste: devolve o texto real do pt.json para as chaves que
 * importam, já que os literais da especificação são o objeto do teste.
 *
 * @param key Chave de tradução.
 * @param named Parâmetros nomeados ou contagem de plural.
 * @returns Texto traduzido.
 */
const translate = (key: string, named?: Record<string, unknown> | number): string => {
  if (key === "import.review.progress" && typeof named === "object" && named) {
    return `${String(named.resolved)} de ${String(named.total)} conferidos`;
  }
  if (key === "import.review.cardCounter" && typeof named === "object" && named) {
    return `Transação ${String(named.current)} de ${String(named.total)}`;
  }
  if (key === "import.review.pending") {
    return `${String(named)} pendentes`;
  }
  if (key === "import.rejectedRows.title") {
    return `${String(named)} linhas não foram importadas`;
  }
  if (key === "import.rejectedRows.lineLabel" && typeof named === "object" && named) {
    return `Linha ${String(named.line)}`;
  }
  return MESSAGES[key] ?? key;
};

vi.mock("vue-i18n", () => ({ useI18n: (): { t: typeof translate } => ({ t: translate }) }));
vi.mock("#imports", () => ({ useI18n: (): { t: typeof translate } => ({ t: translate }) }));

vi.mock("naive-ui", () => ({
  NModal: {
    template: "<div v-if='show'><h2>{{ title }}</h2><slot /><slot name='footer' /></div>",
    props: ["show", "title"],
  },
  NCard: { template: "<section><slot /></section>" },
  NTag: { template: "<span class='tag'><slot /></span>" },
  NText: { template: "<span><slot /></span>" },
  NAlert: { template: "<div class='alert'><slot /></div>", props: ["title"] },
  NCollapse: { template: "<div><slot /></div>" },
  NCollapseItem: { template: "<div><slot /></div>", props: ["title", "name"] },
  // Sem `@click` explícito: o listener do componente já chega ao <button> por
  // fallthrough, e emitir de novo aqui contaria cada clique duas vezes.
  NButton: {
    template: "<button :disabled='disabled'><slot /></button>",
    props: ["disabled", "loading", "type", "quaternary"],
  },
  NInput: {
    template: "<input :value='value' @input=\"$emit('update:value', $event.target.value)\" />",
    props: ["value", "placeholder"],
  },
}));

/**
 * Monta uma linha do preview no domínio.
 *
 * @param overrides Campos a sobrescrever.
 * @returns Draft de transação.
 */
const draft = (
  overrides: Partial<ImportTransactionDraft> = {},
): ImportTransactionDraft => ({
  id: "d1",
  date: "2026-07-05",
  description: "",
  amount: "89.90",
  type: "expense",
  category: "outros",
  confidence: 0.4,
  isDuplicate: false,
  missingFields: ["description"],
  ...overrides,
});

/**
 * Monta um card de conferência.
 *
 * @param overrides Campos a sobrescrever.
 * @returns Card exibido no modal.
 */
const card = (overrides: Partial<ImportReviewCard> = {}): ImportReviewCard => ({
  draft: draft(),
  answers: {},
  isResolved: false,
  ...overrides,
});

/**
 * Monta o modal de conferência com uma pendência por padrão.
 *
 * @param props Props a sobrescrever.
 * @returns Wrapper do componente.
 */
const mountModal = (
  props: Partial<InstanceType<typeof ImportReviewModal>["$props"]> = {},
): ReturnType<typeof mount> =>
  mount(ImportReviewModal, {
    props: {
      show: true,
      cards: [card()],
      totalCount: 1,
      resolvedCount: 0,
      pendingCount: 1,
      isComplete: false,
      busy: false,
      ...props,
    },
  });

describe("ImportReviewModal", () => {
  it("mostra o título literal da especificação e o contador", () => {
    const wrapper = mountModal();

    expect(wrapper.text()).toContain(
      "Antes de prosseguir, precisamos conferir se as informações estão corretas",
    );
    expect(wrapper.find("[data-testid=\"import-review-progress\"]").text()).toContain(
      "0 de 1 conferidos",
    );
  });

  it("pergunta o título quando é o título que falta", () => {
    const wrapper = mountModal();

    expect(wrapper.text()).toContain("Qual o título desta transação?");
    expect(wrapper.text()).not.toContain("Qual o valor desta transação?");
  });

  it("pergunta o valor quando é o valor que falta", () => {
    const wrapper = mountModal({
      cards: [card({ draft: draft({ description: "Farmácia", missingFields: ["amount"] }) })],
    });

    expect(wrapper.text()).toContain("Qual o valor desta transação?");
  });

  it("deixa explícito se a transação é receita ou despesa", () => {
    expect(mountModal().text()).toContain("Despesa");
    expect(
      mountModal({ cards: [card({ draft: draft({ type: "income" }) })] }).text(),
    ).toContain("Receita");
  });

  it("bloqueia a conclusão com explicação em texto enquanto há pendência", () => {
    const wrapper = mountModal();

    // `disabled` sozinho não conta o motivo a ninguém.
    expect(wrapper.find("[data-testid=\"import-review-blocked-hint\"]").exists()).toBe(true);
    expect(
      wrapper.find("[data-testid=\"import-review-submit\"]").attributes("disabled"),
    ).toBeDefined();
  });

  it("libera a conclusão quando nada mais falta", async () => {
    const wrapper = mountModal({
      cards: [card({ isResolved: true, answers: { description: "Mercado" } })],
      resolvedCount: 1,
      pendingCount: 0,
      isComplete: true,
    });

    expect(wrapper.find("[data-testid=\"import-review-blocked-hint\"]").exists()).toBe(false);

    await wrapper.find("[data-testid=\"import-review-submit\"]").trigger("click");

    expect(wrapper.emitted("submit")).toHaveLength(1);
  });

  it("emite a resposta digitada com o campo certo", async () => {
    const wrapper = mountModal();

    await wrapper
      .find("[data-testid=\"import-review-description-d1\"]")
      .setValue("Mercado do bairro");

    expect(wrapper.emitted("answer")?.[0]).toEqual(["d1", "description", "Mercado do bairro"]);
  });

  it("emite finish-later pelo botão de terminar depois", async () => {
    const wrapper = mountModal();

    await wrapper.find("[data-testid=\"import-review-finish-later\"]").trigger("click");

    expect(wrapper.emitted("finish-later")).toHaveLength(1);
  });
});

describe("ImportFinishLaterModal", () => {
  it("mostra o texto literal e emite os dois desfechos", async () => {
    const wrapper = mount(ImportFinishLaterModal, {
      props: { show: true, busy: false },
    });

    expect(wrapper.text()).toContain(
      "Caso queira terminar de cadastrar suas transações posteriormente",
    );

    await wrapper.find("[data-testid=\"import-finish-later-confirm\"]").trigger("click");
    expect(wrapper.emitted("confirm")).toHaveLength(1);

    await wrapper.find("[data-testid=\"import-finish-later-cancel\"]").trigger("click");
    expect(wrapper.emitted("cancel")).toHaveLength(1);
  });
});

describe("ImportRejectedRowsPanel", () => {
  it("não aparece no caminho feliz", () => {
    const wrapper = mount(ImportRejectedRowsPanel, { props: { rows: [] } });

    expect(wrapper.find("[data-testid=\"import-rejected-rows\"]").exists()).toBe(false);
  });

  it("lista linha e motivo quando o parser perdeu linhas", () => {
    const wrapper = mount(ImportRejectedRowsPanel, {
      props: {
        rows: [
          { lineNumber: 7, reason: "Data inválida" },
          { lineNumber: 12, reason: "Linha truncada" },
        ],
      },
    });

    expect(wrapper.find("[data-testid=\"import-rejected-rows\"]").exists()).toBe(true);
    expect(wrapper.text()).toContain("Linha 7");
    expect(wrapper.text()).toContain("Data inválida");
    expect(wrapper.text()).toContain("Linha 12");
  });
});
