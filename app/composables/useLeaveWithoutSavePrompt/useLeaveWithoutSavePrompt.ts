import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { useDialog } from "naive-ui";
import { useI18n } from "vue-i18n";

import type {
  LeaveWithoutSavePromptOptions,
  LeaveWithoutSavePromptReturn,
} from "./useLeaveWithoutSavePrompt.types";

const BEFOREUNLOAD_FALLBACK_MESSAGE =
  "Você ainda não salvou esta simulação. Se sair agora, ela será descartada.";

interface RunSaveContext {
  readonly isSaving: Ref<boolean>;
  readonly saveError: Ref<unknown | null>;
  readonly onSave: () => Promise<void>;
}

/**
 * Awaits {@link RunSaveContext.onSave} while toggling the saving and
 * error refs around the call.
 * @param ctx Save handler + reactive flags.
 * @returns `true` when the save resolves cleanly; `false` when it throws.
 */
const runSave = async (ctx: RunSaveContext): Promise<boolean> => {
  ctx.isSaving.value = true;
  ctx.saveError.value = null;
  try {
    await ctx.onSave();
    return true;
  } catch (error) {
    ctx.saveError.value = error;
    return false;
  } finally {
    ctx.isSaving.value = false;
  }
};

interface PromptCopy {
  readonly title: string;
  readonly content: string;
  readonly positiveText: string;
  readonly negativeText: string;
}

interface PromptContext extends RunSaveContext {
  readonly dialog: ReturnType<typeof useDialog>;
  readonly copy: PromptCopy;
  readonly onDiscard?: () => void;
}

/**
 * Renders the leave-without-save modal and resolves with the user's choice.
 *
 * Naive UI dialogs only expose two action buttons natively, so the close
 * (X) and mask click are mapped to the implicit "Cancelar" outcome.
 * @param ctx Dialog handle, copy, save/discard handlers and reactive flags.
 * @returns `true` when the user confirms (save or discard) and the caller
 *  may proceed with the navigation; `false` when the modal is dismissed.
 */
const renderPrompt = (ctx: PromptContext): Promise<boolean> => {
  return new Promise((resolve) => {
    ctx.dialog.warning({
      title: ctx.copy.title,
      content: ctx.copy.content,
      positiveText: ctx.copy.positiveText,
      negativeText: ctx.copy.negativeText,
      closable: true,
      onPositiveClick: async () => {
        const ok = await runSave(ctx);
        resolve(ok);
      },
      onNegativeClick: () => {
        ctx.onDiscard?.();
        resolve(true);
      },
      onClose: () => resolve(false),
      onMaskClick: () => resolve(false),
    });
  });
};

/**
 * Intercepts navigation away from a tool page when the user has computed
 * a simulation but has not saved it yet (DEC-196 UX contract).
 *
 * Wires three exit surfaces:
 *
 * 1. **Vue Router** — `onBeforeRouteLeave` shows a 3-option modal
 *    (Salvar e sair / Descartar e sair / Cancelar). The result of the
 *    user's choice resolves the navigation guard.
 * 2. **Browser tab close / reload** — `window.beforeunload` triggers the
 *    native browser confirmation only while `isDirty` is `true`. The
 *    custom modal is impossible here because modern browsers ignore
 *    bespoke prompts on `beforeunload`; the native prompt is the most
 *    reliable signal.
 * 3. **Imperative cancellation** — `confirmLeave()` runs the same modal
 *    so a custom "Cancelar" button on the page can ask before discarding.
 *
 * Must be called inside a component whose ancestor tree contains a
 * Naive UI dialog provider. `isDirty` should flip to `false` after a
 * successful save so subsequent navigations are silent.
 * @param options Reactive dirty flag plus save/discard handlers.
 * @returns Reactive saving/error refs and an imperative `confirmLeave`
 *  helper for pages that ship a custom cancel button.
 */
export function useLeaveWithoutSavePrompt(
  options: LeaveWithoutSavePromptOptions,
): LeaveWithoutSavePromptReturn {
  const dialog = useDialog();
  const { t } = useI18n();
  const isSaving = ref(false);
  const saveError = ref<unknown | null>(null);

  /**
   * Triggers the browser's native unload prompt while the page is dirty.
   * @param event Beforeunload event from the global window object.
   */
  const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    if (!options.isDirty.value) {
      return;
    }
    event.preventDefault();
    event.returnValue = BEFOREUNLOAD_FALLBACK_MESSAGE;
  };

  onMounted(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }
  });

  onBeforeUnmount(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  });

  /**
   * Renders the modal with the localized copy and the captured handlers.
   * @returns User decision: `true` to proceed, `false` to stay.
   */
  const showPrompt = (): Promise<boolean> =>
    renderPrompt({
      dialog,
      isSaving,
      saveError,
      onSave: options.onSave,
      onDiscard: options.onDiscard,
      copy: {
        title: t("leaveWithoutSavePrompt.title"),
        content: t("leaveWithoutSavePrompt.content"),
        positiveText: t("leaveWithoutSavePrompt.positiveText"),
        negativeText: t("leaveWithoutSavePrompt.negativeText"),
      },
    });

  onBeforeRouteLeave(async (_to, _from, next) => {
    if (!options.isDirty.value) {
      next();
      return;
    }
    const proceed = await showPrompt();
    next(proceed);
  });

  /**
   * Imperative leave-prompt for custom cancel buttons on the page.
   * @returns `true` when the page can close, `false` when the user stays.
   */
  const confirmLeave = async (): Promise<boolean> => {
    if (!options.isDirty.value) {
      return true;
    }
    return showPrompt();
  };

  return {
    isSaving,
    saveError,
    confirmLeave,
  };
}
