/**
 * iCal (RFC 5545) export utility for due-date transactions.
 *
 * Generates a VCALENDAR string with one VEVENT per transaction and triggers a
 * browser download.  No external dependencies required.
 *
 * Issue: #545 (parent PROD-14), #580
 */

import type { DueTransactionDto } from "../contracts/due-range.dto";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formats an ISO date string (YYYY-MM-DD) as an iCal DATE value (YYYYMMDD).
 *
 * @param isoDate - ISO 8601 date string.
 * @returns iCal DATE string.
 */
function toICalDate(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

/**
 * Returns the current UTC timestamp in iCal DATETIME format (YYYYMMDDTHHMMSSZ).
 *
 * @returns iCal DATETIME string.
 */
function nowICalDateTime(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Folds a long iCal line at 75 octets per RFC 5545 §3.1.
 *
 * @param line - Raw unfolded iCal line.
 * @returns Folded line(s) as a single string with CRLF+SPACE continuation.
 */
function foldLine(line: string): string {
  const MAX = 75;
  if (line.length <= MAX) { return line; }

  const parts: string[] = [];
  let remaining = line;

  while (remaining.length > MAX) {
    parts.push(remaining.slice(0, MAX));
    remaining = remaining.slice(MAX);
  }

  if (remaining.length > 0) { parts.push(remaining); }

  return parts.join("\r\n ");
}

/**
 * Escapes special characters in iCal text values per RFC 5545 §3.3.11.
 *
 * @param text - Raw text value.
 * @returns Escaped text safe for SUMMARY / DESCRIPTION properties.
 */
function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// ── VEVENT builder ────────────────────────────────────────────────────────────

/**
 * Builds a single VEVENT block for a due transaction.
 *
 * @param tx - Due transaction item.
 * @param dtstamp - DTSTAMP value reused across all events in a calendar.
 * @returns VEVENT lines array (not joined yet).
 */
function buildVEvent(tx: DueTransactionDto, dtstamp: string): string[] {
  const amountNum = parseFloat(tx.amount);
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountNum);

  const summary = escapeText(`${tx.type === "expense" ? "Despesa" : "Receita"}: ${tx.title}`);
  const description = escapeText(
    `Valor: ${formattedAmount} | Status: ${tx.status} | ID: ${tx.id}`,
  );

  return [
    "BEGIN:VEVENT",
    foldLine(`UID:auraxis-${tx.id}@auraxis.com.br`),
    foldLine(`DTSTAMP:${dtstamp}`),
    foldLine(`DTSTART;VALUE=DATE:${toICalDate(tx.due_date)}`),
    foldLine(`DTEND;VALUE=DATE:${toICalDate(tx.due_date)}`),
    foldLine(`SUMMARY:${summary}`),
    foldLine(`DESCRIPTION:${description}`),
    "END:VEVENT",
  ];
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generates a VCALENDAR string from a list of due transactions.
 *
 * @param transactions - List of due transactions to include as VEVENTs.
 * @param calendarName - Display name for the calendar (PRODID / X-WR-CALNAME).
 * @returns RFC 5545-compliant VCALENDAR string.
 */
export function buildICalString(
  transactions: readonly DueTransactionDto[],
  calendarName = "Auraxis — Vencimentos",
): string {
  const dtstamp = nowICalDateTime();

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    foldLine("PRODID:-//Auraxis//Vencimentos//PT"),
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`X-WR-CALNAME:${escapeText(calendarName)}`),
    "X-WR-TIMEZONE:America/Sao_Paulo",
  ];

  for (const tx of transactions) {
    lines.push(...buildVEvent(tx, dtstamp));
  }

  lines.push("END:VCALENDAR");

  return lines.join("\r\n") + "\r\n";
}

/**
 * Triggers a browser download of an .ics file containing the given transactions.
 *
 * @param transactions - Transactions to export.
 * @param filename - Desired file name (without extension).
 */
export function downloadICalFile(
  transactions: readonly DueTransactionDto[],
  filename = "auraxis-vencimentos",
): void {
  const content = buildICalString(transactions);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename + ".ics";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Release the object URL after a short delay to ensure the download starts.
  setTimeout(() => { URL.revokeObjectURL(url); }, 1000);
}
