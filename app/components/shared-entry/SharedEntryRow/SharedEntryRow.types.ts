import type { SharedEntryDto } from "~/features/shared-entries/contracts/shared-entry.dto";

export type SharedEntryRowProps = {
  entry: SharedEntryDto;
  mode: "by-me" | "with-me";
};

export type SharedEntryRowEmits = {
  /** Emitted when the user revokes a shared entry. Only relevant in by-me + pending mode. */
  (event: "revoke", id: string): void;
};
