import { describe, it, expect } from "vitest";
import { buildICalString } from "../ical-export";
import type { DueTransactionDto } from "../../contracts/due-range.dto";

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Builds a minimal DueTransactionDto for testing.
 *
 * @param overrides Fields to override from defaults.
 * @returns DueTransactionDto instance.
 */
function makeTransaction(overrides: Partial<DueTransactionDto> = {}): DueTransactionDto {
  return {
    id: "abc-123",
    title: "Netflix",
    amount: "39.90",
    type: "expense",
    due_date: "2025-06-15",
    status: "pending",
    tag_id: null,
    account_id: null,
    credit_card_id: null,
    is_recurring: false,
    ...overrides,
  };
}

// ── buildICalString ───────────────────────────────────────────────────────────

describe("buildICalString", () => {
  it("produces a VCALENDAR wrapper", () => {
    const output = buildICalString([makeTransaction()]);
    expect(output).toContain("BEGIN:VCALENDAR");
    expect(output).toContain("END:VCALENDAR");
  });

  it("produces one VEVENT per transaction", () => {
    const txs = [
      makeTransaction({ id: "a" }),
      makeTransaction({ id: "b", title: "Spotify" }),
    ];
    const output = buildICalString(txs);
    const matches = output.match(/BEGIN:VEVENT/g);
    expect(matches).toHaveLength(2);
  });

  it("encodes the transaction id in the UID", () => {
    const output = buildICalString([makeTransaction({ id: "tx-999" })]);
    expect(output).toContain("auraxis-tx-999@auraxis.com.br");
  });

  it("converts due_date to iCal DATE format YYYYMMDD", () => {
    const output = buildICalString([makeTransaction({ due_date: "2025-06-15" })]);
    expect(output).toContain("DTSTART;VALUE=DATE:20250615");
    expect(output).toContain("DTEND;VALUE=DATE:20250615");
  });

  it("includes the transaction title in SUMMARY", () => {
    const output = buildICalString([makeTransaction({ title: "Aluguel", type: "expense" })]);
    expect(output).toContain("Despesa: Aluguel");
  });

  it("prefixes SUMMARY with Receita for income transactions", () => {
    const output = buildICalString([makeTransaction({ title: "Salário", type: "income" })]);
    expect(output).toContain("Receita: Salário");
  });

  it("escapes special characters in SUMMARY", () => {
    const output = buildICalString([makeTransaction({ title: "Conta; água, gás" })]);
    expect(output).toContain("Conta\\; água\\, gás");
  });

  it("returns empty VCALENDAR (no VEVENTs) for empty list", () => {
    const output = buildICalString([]);
    expect(output).toContain("BEGIN:VCALENDAR");
    expect(output).not.toContain("BEGIN:VEVENT");
    expect(output).toContain("END:VCALENDAR");
  });

  it("uses custom calendar name when provided", () => {
    const output = buildICalString([], "Meu Calendário");
    expect(output).toContain("X-WR-CALNAME:Meu Calendário");
  });

  it("uses default calendar name when not provided", () => {
    const output = buildICalString([]);
    expect(output).toContain("X-WR-CALNAME:Auraxis");
  });

  it("lines end with CRLF as per RFC 5545", () => {
    const output = buildICalString([makeTransaction()]);
    expect(output).toContain("\r\n");
  });

  it("includes VERSION:2.0", () => {
    const output = buildICalString([]);
    expect(output).toContain("VERSION:2.0");
  });

  it("includes CALSCALE:GREGORIAN", () => {
    const output = buildICalString([]);
    expect(output).toContain("CALSCALE:GREGORIAN");
  });

  it("folds lines longer than 75 chars with CRLF+SPACE", () => {
    // A very long title will produce a SUMMARY line exceeding 75 chars.
    const longTitle = "A".repeat(80);
    const output = buildICalString([makeTransaction({ title: longTitle })]);
    // Verify no line (split on CRLF) exceeds 75 chars (except folded continuation).
    const lines = output.split("\r\n");
    for (const line of lines) {
      if (line.startsWith(" ")) {
        // Continuation line — may still be up to 75 octets after the leading space.
        expect(line.length).toBeLessThanOrEqual(76);
      } else {
        expect(line.length).toBeLessThanOrEqual(75);
      }
    }
  });
});
