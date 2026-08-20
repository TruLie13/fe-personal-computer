import { useCallback, useMemo, useState } from "react";
import {
  buildBulkDeleteConfirmMessage,
  buildDeleteConfirmMessage,
  deletableSelection,
} from "@/lib/deleteConfirm";
import type { DesktopIcon } from "@/types/desktop";

export function useDeleteConfirm(icons: DesktopIcon[]) {
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  const pendingTargets = useMemo(
    () => deletableSelection(icons, pendingDeleteIds),
    [icons, pendingDeleteIds],
  );

  const deletePrompt = useMemo(() => {
    if (pendingTargets.length === 0) {
      return null;
    }
    if (pendingTargets.length === 1 && pendingTargets[0]) {
      return buildDeleteConfirmMessage(pendingTargets[0], icons);
    }
    return buildBulkDeleteConfirmMessage(pendingTargets);
  }, [icons, pendingTargets]);

  const requestDelete = useCallback((iconId: string) => {
    setPendingDeleteIds([iconId]);
  }, []);

  const requestDeleteMany = useCallback((iconIds: ReadonlyArray<string>) => {
    setPendingDeleteIds([...iconIds]);
  }, []);

  const cancelDelete = useCallback(() => {
    setPendingDeleteIds([]);
  }, []);

  /** Clears pending ids and returns them so the caller can delete. */
  const confirmDelete = useCallback((): string[] => {
    if (pendingDeleteIds.length === 0) {
      return [];
    }
    const ids = pendingDeleteIds;
    setPendingDeleteIds([]);
    return ids;
  }, [pendingDeleteIds]);

  return {
    pendingDeleteIds,
    deletePrompt,
    requestDelete,
    requestDeleteMany,
    cancelDelete,
    confirmDelete,
  };
}
