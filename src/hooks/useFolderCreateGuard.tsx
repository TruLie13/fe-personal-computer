"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/desktop/ConfirmDialog";
import {
  canCreateFolder,
  countFolders,
  MAX_FOLDERS_PER_USER,
} from "@/lib/storage";
import { useDesktopStore } from "@/store/desktopStore";

/**
 * Shared “New Folder” guard — popup when at the folder cap (BBS-style),
 * used by desktop context menu, Start menu, and folder toolbar.
 */
export function useFolderCreateGuard() {
  const icons = useDesktopStore((state) => state.icons);
  const createFolder = useDesktopStore((state) => state.createFolder);
  const [showLimit, setShowLimit] = useState(false);

  const folderCount = countFolders(icons);
  const atLimit = !canCreateFolder(icons);

  const tryCreateFolder = (
    ...args: Parameters<typeof createFolder>
  ): string | null => {
    if (!canCreateFolder(useDesktopStore.getState().icons)) {
      setShowLimit(true);
      return null;
    }
    return createFolder(...args);
  };

  const dismissLimit = () => setShowLimit(false);

  const folderLimitDialog = showLimit ? (
    <ConfirmDialog
      title="New Folder"
      message={`You have reached the limit of ${MAX_FOLDERS_PER_USER} folders (${folderCount}/${MAX_FOLDERS_PER_USER}).\n\nDelete a folder before creating another.`}
      confirmLabel="OK"
      showCancel={false}
      onConfirm={dismissLimit}
      onCancel={dismissLimit}
    />
  ) : null;

  return {
    tryCreateFolder,
    folderLimitDialog,
    atLimit,
    folderCount,
  };
}
