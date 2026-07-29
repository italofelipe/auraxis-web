import { describe, expect, it } from "vitest";
import {
  readLoginEntryContext,
  readLoginEntryContextFromSources,
  resolvePostLoginDestination,
} from "./login-entry-context";

describe("readLoginEntryContext", () => {
  it("reconhece a vinda do checkout com plano", () => {
    expect(readLoginEntryContext({ motivo: "conta-existente", plano: "anual" })).toEqual({
      reason: "conta-existente",
      planSlug: "anual",
    });
  });

  it("aceita o plano mensal", () => {
    expect(readLoginEntryContext({ motivo: "conta-existente", plano: "mensal" }).planSlug).toBe(
      "mensal",
    );
  });

  it("ignora motivo desconhecido — a tela não exibe texto arbitrário", () => {
    // Um link forjado (?motivo=<script>…) não pode virar mensagem na tela.
    expect(readLoginEntryContext({ motivo: "qualquer-coisa" }).reason).toBeNull();
  });

  it("ignora plano fora da lista vendável", () => {
    expect(readLoginEntryContext({ motivo: "conta-existente", plano: "vitalicio" }).planSlug)
      .toBeNull();
  });

  it("normaliza caixa e espaços", () => {
    expect(readLoginEntryContext({ motivo: " Conta-Existente ", plano: "ANUAL" })).toEqual({
      reason: "conta-existente",
      planSlug: "anual",
    });
  });

  it("lida com parâmetro repetido usando o primeiro valor", () => {
    expect(
      readLoginEntryContext({ motivo: ["conta-existente", "outro"], plano: ["anual"] }),
    ).toEqual({ reason: "conta-existente", planSlug: "anual" });
  });

  it("devolve nulos quando não há query", () => {
    expect(readLoginEntryContext({})).toEqual({ reason: null, planSlug: null });
  });
});

describe("resolvePostLoginDestination", () => {
  it("retoma a assinatura com o plano escolhido", () => {
    expect(
      resolvePostLoginDestination({ reason: "conta-existente", planSlug: "anual" }),
    ).toBe("/plans?plano=anual");
  });

  it("não desvia quando não veio do checkout", () => {
    expect(resolvePostLoginDestination({ reason: null, planSlug: "anual" })).toBeNull();
  });

  it("não desvia quando o plano não foi reconhecido", () => {
    expect(
      resolvePostLoginDestination({ reason: "conta-existente", planSlug: null }),
    ).toBeNull();
  });
});

describe("readLoginEntryContextFromSources", () => {
  it("usa a query da rota quando ela sobreviveu", () => {
    expect(
      readLoginEntryContextFromSources({ motivo: "conta-existente", plano: "anual" }),
    ).toEqual({ reason: "conta-existente", planSlug: "anual" });
  });

  it("recupera da location quando a rota prerenderizada perdeu a query", () => {
    // Página SSG: o Nuxt normaliza a rota na hidratação e route.query some.
    expect(
      readLoginEntryContextFromSources({}, "?motivo=conta-existente&plano=mensal"),
    ).toEqual({ reason: "conta-existente", planSlug: "mensal" });
  });

  it("recupera da URL completa da entrada de navegação", () => {
    expect(
      readLoginEntryContextFromSources(
        {},
        "",
        "https://app.auraxis.com.br/login?motivo=conta-existente&plano=anual",
      ),
    ).toEqual({ reason: "conta-existente", planSlug: "anual" });
  });

  it("ignora fontes vazias e segue para a próxima", () => {
    expect(
      readLoginEntryContextFromSources({}, null, undefined, "?motivo=conta-existente"),
    ).toEqual({ reason: "conta-existente", planSlug: null });
  });

  it("devolve nulos quando nenhuma fonte tem o motivo", () => {
    expect(readLoginEntryContextFromSources({}, "?outra=coisa", "")).toEqual({
      reason: null,
      planSlug: null,
    });
  });
});
