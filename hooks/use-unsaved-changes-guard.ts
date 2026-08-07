import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Guards navigation away from a form that has unsaved changes. Covers the
 * two ways data currently gets silently dropped: a hard navigation (tab
 * close, refresh, typed URL) via `beforeunload`, and an in-app "leave"
 * action (Cancel button, switching to a new draft) via `guardNavigation` —
 * callers wrap whatever they'd otherwise call directly (e.g. `router.push`)
 * so it only runs once the user confirms discarding the current changes.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirtyRef.current) {
        return;
      }
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const guardNavigation = useCallback((action: () => void) => {
    if (isDirtyRef.current) {
      pendingActionRef.current = action;
      setIsConfirmOpen(true);
    } else {
      action();
    }
  }, []);

  const confirmLeave = useCallback(() => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setIsConfirmOpen(false);
    action?.();
  }, []);

  const cancelLeave = useCallback(() => {
    pendingActionRef.current = null;
    setIsConfirmOpen(false);
  }, []);

  return { isConfirmOpen, guardNavigation, confirmLeave, cancelLeave };
}
