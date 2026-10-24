import "./page-transition.css";

export interface PageTransitionOptions {
  /** Inject a document for an embedded application. Omit for the current page. */
  document?: Document;
}

export interface PageTransitionRunOptions {
  /** Skip snapshots when another modal or the browser already owns the change. */
  skip?: boolean;
}

export interface PageTransitionController {
  /** Commit a synchronous DOM update; resolves when its transition finishes. */
  run(update: () => void, options?: PageTransitionRunOptions): Promise<void>;
  /** Stop the current animation while still allowing its DOM update to run. */
  skip(): void;
  /** Invalidate pending updates and remove the active visual state on teardown. */
  cancel(): void;
}

/**
 * Progressive same-document motion for one router. Mark exactly one content
 * wrapper with dm-page-transition; keep persistent navigation outside it.
 * This helper does not change URLs, history, scroll position, or focus.
 */
export function createPageTransition(
  options: PageTransitionOptions = {},
): PageTransitionController {
  let generation = 0;
  let active:
    | { transition: ViewTransition; root: HTMLElement; cleanup: () => void }
    | undefined;

  const skip = () => {
    if (!active) return;
    const previous = active;
    active = undefined;
    previous.transition.skipTransition();
    previous.cleanup();
    previous.root.removeAttribute("data-dm-page-transition");
  };

  return {
    run(update, { skip: immediate = false } = {}) {
      const current = ++generation;
      skip();
      const owner =
        options.document ??
        (typeof document === "undefined" ? undefined : document);
      const reduced = owner?.defaultView?.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      );
      let committed = false;
      const commit = () => {
        // skipTransition cancels snapshots, not the browser's queued callback.
        // A superseded callback must never restore an obsolete route.
        if (current !== generation || committed) return;
        committed = true;
        update();
      };
      if (
        immediate ||
        !owner?.startViewTransition ||
        reduced?.matches ||
        owner.visibilityState === "hidden"
      ) {
        try {
          commit();
          return Promise.resolve();
        } catch (error) {
          return Promise.reject(error);
        }
      }

      const root = owner.documentElement;
      root.setAttribute("data-dm-page-transition", "");
      let transition: ViewTransition;
      try {
        transition = owner.startViewTransition(commit);
      } catch (error) {
        root.removeAttribute("data-dm-page-transition");
        if (committed) return Promise.reject(error);
        try {
          commit();
          return Promise.resolve();
        } catch (updateError) {
          return Promise.reject(updateError);
        }
      }

      const reduceChanged = () => {
        if (reduced?.matches) skip();
      };
      const visibilityChanged = () => {
        if (owner.visibilityState === "hidden") skip();
      };
      reduced?.addEventListener("change", reduceChanged);
      owner.addEventListener("visibilitychange", visibilityChanged);
      const entry = {
        transition,
        root,
        cleanup: () => {
          reduced?.removeEventListener("change", reduceChanged);
          owner.removeEventListener("visibilitychange", visibilityChanged);
        },
      };
      active = entry;
      // A skipped capture rejects ready; the DOM update and finished still settle.
      void transition.ready.catch(() => {});
      void transition.updateCallbackDone.catch(() => {});
      return transition.finished.finally(() => {
        entry.cleanup();
        if (active === entry) {
          active = undefined;
          root.removeAttribute("data-dm-page-transition");
        }
      });
    },
    skip,
    cancel() {
      generation += 1;
      skip();
    },
  };
}
