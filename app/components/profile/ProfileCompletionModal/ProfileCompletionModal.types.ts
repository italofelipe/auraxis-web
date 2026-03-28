export interface ProfileCompletionModalProps {
  /** Controls modal visibility. */
  open: boolean;
}

export interface ProfileCompletionModalEmits {
  /** Emitted when the user closes/dismisses the modal (close) or after a successful save (saved). */
  (event: "close" | "saved"): void;
}
