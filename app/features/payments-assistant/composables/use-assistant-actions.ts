/**
 * Action handlers for the Payments Assistant deck.
 *
 * Extracted from {@link usePaymentAssistant} so the orchestrator stays small and
 * each concern (open/close/auto-open, pay/discard/skip, undo) is easy to read.
 * All side effects (mutations) flow through here; the pure deck reducer drives
 * navigation.
 */

import type { ComputedRef, Ref } from "vue";

import type { TransactionDto, UpdateTransactionPayload } from "~/features/transactions/contracts/transaction.dto";

import { shouldAutoOpenAssistant, markAssistantShown, wasAssistantShown } from "../services/payment-assistant.session";
import {
  type DeckAction,
  type DeckState,
  advanceDeck,
  createDeck,
  currentCard,
  undoDeck,
} from "../services/payment-assistant.deck";

/** A mutation surface exposing only the `mutateAsync` used by the assistant. */
interface MutateAsync<TArgs> {
  readonly mutateAsync: (args: TArgs) => Promise<unknown>;
}

/** The four transaction mutations the assistant drives. */
export interface AssistantMutations {
  readonly markPaid: MutateAsync<{ id: string; paidAt: string }>;
  readonly remove: MutateAsync<{ id: string; scope: "occurrence" | "series" }>;
  readonly update: MutateAsync<{ id: string; payload: UpdateTransactionPayload }>;
  readonly restore: { readonly mutateAsync: (id: string) => Promise<unknown> };
}

/** Reactive dependencies the action handlers operate on. */
export interface AssistantActionsDeps {
  readonly deck: Ref<DeckState>;
  readonly current: ComputedRef<TransactionDto | null>;
  readonly candidates: ComputedRef<TransactionDto[]>;
  readonly isOpen: Ref<boolean>;
  readonly lastAction: Ref<DeckAction | null>;
  readonly flagEnabled: Readonly<Ref<boolean>>;
  readonly isPremium: ComputedRef<boolean>;
  readonly mutations: AssistantMutations;
  readonly now: () => Date;
}

/** The handler surface returned to the composable. */
export interface AssistantActions {
  open: () => void;
  close: () => void;
  maybeAutoOpen: (heldByOtherModals: boolean) => boolean;
  pay: () => Promise<void>;
  discard: () => Promise<void>;
  skipCard: () => void;
  markAllPaid: () => Promise<void>;
  undo: () => Promise<DeckAction | null>;
}

/**
 * Builds the assistant's action handlers over the given reactive dependencies.
 *
 * @param deps Reactive state and mutation surfaces.
 * @returns The handler functions wiring user intents to mutations + deck moves.
 */
export const useAssistantActions = (deps: AssistantActionsDeps): AssistantActions => {
  const { deck, current, candidates, isOpen, lastAction, flagEnabled, isPremium, mutations, now } =
    deps;

  /** Opens the assistant with the current candidate set and marks the session. */
  const open = (): void => {
    deck.value = createDeck(candidates.value);
    lastAction.value = null;
    isOpen.value = true;
    markAssistantShown();
  };

  /** Closes the assistant. */
  const close = (): void => {
    isOpen.value = false;
  };

  /**
   * Opens the assistant automatically when all gating conditions are satisfied.
   *
   * @param heldByOtherModals Whether a higher-priority modal holds the surface.
   * @returns True when it opened.
   */
  const maybeAutoOpen = (heldByOtherModals: boolean): boolean => {
    const should = shouldAutoOpenAssistant({
      flagEnabled: flagEnabled.value,
      isPremium: isPremium.value,
      shownThisSession: wasAssistantShown(),
      candidateCount: candidates.value.length,
      heldByOtherModals,
    });
    if (should) {
      open();
    }
    return should;
  };

  /** Marks the current card as paid and advances. */
  const pay = async (): Promise<void> => {
    const card = current.value;
    if (!card) {
      return;
    }
    await mutations.markPaid.mutateAsync({ id: card.id, paidAt: now().toISOString() });
    deck.value = advanceDeck(deck.value, "paid");
    lastAction.value = { kind: "paid", card };
  };

  /** Soft-deletes the current card and advances. */
  const discard = async (): Promise<void> => {
    const card = current.value;
    if (!card) {
      return;
    }
    await mutations.remove.mutateAsync({ id: card.id, scope: "occurrence" });
    deck.value = advanceDeck(deck.value, "deleted");
    lastAction.value = { kind: "deleted", card };
  };

  /** Skips the current card without mutating it. */
  const skipCard = (): void => {
    const card = current.value;
    if (!card) {
      return;
    }
    deck.value = advanceDeck(deck.value, "skipped");
    lastAction.value = { kind: "skipped", card };
  };

  /** Marks every remaining card as paid in order. */
  const markAllPaid = async (): Promise<void> => {
    let card = currentCard(deck.value);
    while (card) {
      await mutations.markPaid.mutateAsync({ id: card.id, paidAt: now().toISOString() });
      deck.value = advanceDeck(deck.value, "paid");
      lastAction.value = { kind: "paid", card };
      card = currentCard(deck.value);
    }
  };

  /**
   * Reverts the last action: paid → back to pending, deleted → restored.
   *
   * @returns The reverted action, or null when there was nothing to undo.
   */
  const undo = async (): Promise<DeckAction | null> => {
    const { deck: previous, undone } = undoDeck(deck.value);
    if (!undone) {
      return null;
    }
    deck.value = previous;
    lastAction.value = null;
    if (undone.kind === "paid") {
      await mutations.update.mutateAsync({
        id: undone.card.id,
        payload: { status: "pending", paid_at: null },
      });
    } else if (undone.kind === "deleted") {
      await mutations.restore.mutateAsync(undone.card.id);
    }
    return undone;
  };

  return { open, close, maybeAutoOpen, pay, discard, skipCard, markAllPaid, undo };
};
