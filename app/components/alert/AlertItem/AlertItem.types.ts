import type { Alert } from "~/features/alerts/model/alerts";

export type AlertItemProps = {
  alert: Alert;
};

export type AlertItemEmits = {
  /** Emitted when the user marks an alert as read or deletes it. */
  (event: "mark-read" | "delete", id: string): void;
};
