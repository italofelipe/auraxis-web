import type { AlertDto } from "~/features/alerts/contracts/alert.dto";

export type AlertItemProps = {
  alert: AlertDto;
};

export type AlertItemEmits = {
  /** Emitted when the user marks an alert as read or deletes it. */
  (event: "mark-read" | "delete", id: string): void;
};
