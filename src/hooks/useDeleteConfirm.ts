import { useCallback, useMemo, useState } from "react";
import { buildDeleteConfirmMessage } from "@/lib/deleteConfirm";
import type { DesktopIcon } from "@/types/desktop";

export function useDeleteConfirm(icons: DesktopIcon[]) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const pendingDeleteIcon = useMemo(
    () =>
      pendingDeleteId
        ? icons.find((icon) => icon.id === pendingDeleteId)
        : undefined,
    [icons, pendingDeleteId],
  );

  const deletePrompt = useMemo(
    () =>
      pendingDeleteIcon
        ? buildDeleteConfirmMessage(pendingDeleteIcon, icons)
        : null,
    [icons, pendingDeleteIcon],
  );

  const requestDelete = useCallback((iconId: string) => {
    setPendingDeleteId(iconId);
  }, []);

  const cancelDelete = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  /** Clears pending id and returns it so the caller can delete + side-effects. */
  const confirmDelete = useCallback((): string | null => {
    if (!pendingDeleteId) {
      return null;
    }
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    return id;
  }, [pendingDeleteId]);

  return {
    pendingDeleteId,
    deletePrompt,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
