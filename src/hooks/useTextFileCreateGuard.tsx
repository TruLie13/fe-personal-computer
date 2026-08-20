"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/desktop/ConfirmDialog";
import {
  canCreateTextFile,
  countTextFiles,
  MAX_TEXT_FILES_PER_USER,
} from "@/lib/storage";
import { useDesktopStore } from "@/store/desktopStore";

/**
 * Shared “New Text Document” / Notepad-save guard — popup when at the file cap
 * (same pattern as folder limit dialogs).
 */
export function useTextFileCreateGuard() {
  const documents = useDesktopStore((state) => state.documents);
  const createTextFile = useDesktopStore((state) => state.createTextFile);
  const [showLimit, setShowLimit] = useState(false);

  const textFileCount = countTextFiles(documents);
  const atLimit = !canCreateTextFile(documents);

  const tryCreateTextFile = (
    ...args: Parameters<typeof createTextFile>
  ): string | null => {
    if (!canCreateTextFile(useDesktopStore.getState().documents)) {
      setShowLimit(true);
      return null;
    }
    return createTextFile(...args);
  };

  const showTextFileLimit = () => setShowLimit(true);
  const dismissLimit = () => setShowLimit(false);

  const textFileLimitDialog = showLimit ? (
    <ConfirmDialog
      title="New Text Document"
      message={`You have reached the limit of ${MAX_TEXT_FILES_PER_USER} text files (${textFileCount}/${MAX_TEXT_FILES_PER_USER}).\n\nDelete a text file before creating another.`}
      confirmLabel="OK"
      showCancel={false}
      onConfirm={dismissLimit}
      onCancel={dismissLimit}
    />
  ) : null;

  return {
    tryCreateTextFile,
    showTextFileLimit,
    textFileLimitDialog,
    atLimit,
    textFileCount,
  };
}
