/**
 * The kind of financial record the user wants to create from a tool result.
 *
 * - `receivable` — creates an entry in the receivables list (income).
 * - `expense` — creates a transaction of type "expense".
 * - `goal` — creates a new financial goal.
 * - `none` — component renders nothing (tool has no saveable output).
 */
export type SaveIntent = "receivable" | "expense" | "goal" | "none";

/**
 * Props for the ToolSaveResult component.
 */
export interface ToolSaveResultProps {
  /** What kind of record to create on save. `none` → nothing renders. */
  intent: SaveIntent;
  /** Human-readable label for the result (e.g. "13º Salário"). */
  label: string;
  /** Monetary value in centavos (integer). */
  amount: number;
  /** Optional extra description attached to the created record. */
  description?: string;
}
