"use client";

import {
  useEffect,
  useState,
  type MutableRefObject,
} from "react";
import { ConfirmDialog } from "@/components/desktop/ConfirmDialog";
import { useSavedFlash } from "@/hooks/useSavedFlash";
import { useTextFileCreateGuard } from "@/hooks/useTextFileCreateGuard";
import {
  MAX_TEXT_FILE_CHARS,
  MAX_TEXT_FILES_PER_USER,
  MAX_FILE_TITLE_CHARS,
  canCreateTextFile,
  clampFileTitle,
  clampTextFileContent,
  stripTextExtension,
} from "@/lib/storage";
import {
  selectActiveDocuments,
  selectActiveTextFileCount,
  useDesktopStore,
} from "@/store/desktopStore";

interface TextEditorProps {
  windowId: string;
  documentId: string | null;
  /**
   * WindowFrame sets this so the title-bar Close can ask Notepad to
   * intercept when there are unsaved changes. Return true = handled.
   */
  closeInterceptorRef?: MutableRefObject<(() => boolean) | null>;
}

function titleFromWindowTitle(windowTitle: string): string {
  return stripTextExtension(windowTitle.replace(/\s-\sNotepad$/, ""));
}

export function TextEditor({
  windowId,
  documentId,
  closeInterceptorRef,
}: TextEditorProps) {
  const viewMode = useDesktopStore((state) => state.viewMode);
  const documents = useDesktopStore(selectActiveDocuments);
  const textFileCount = useDesktopStore(selectActiveTextFileCount);
  const document = documentId
    ? documents.find((item) => item.id === documentId)
    : undefined;
  const windowTitle = useDesktopStore(
    (state) =>
      state.windows.find((item) => item.id === windowId)?.title ??
      "Untitled - Notepad",
  );
  const saveDocumentFromWindow = useDesktopStore(
    (state) => state.saveDocumentFromWindow,
  );
  const closeWindow = useDesktopStore((state) => state.closeWindow);

  const readOnly = viewMode === "remote";

  const initialTitle = stripTextExtension(
    document?.title ?? titleFromWindowTitle(windowTitle),
  );
  const initialContent = clampTextFileContent(document?.content ?? "");

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [baseline, setBaseline] = useState({
    title: initialTitle,
    content: initialContent,
  });
  const [confirmClose, setConfirmClose] = useState(false);
  const { savedFlash, flashSaved } = useSavedFlash();
  const { showTextFileLimit, textFileLimitDialog } = useTextFileCreateGuard();

  useEffect(() => {
    if (document) {
      const nextTitle = stripTextExtension(document.title);
      const nextContent = clampTextFileContent(document.content);
      setTitle(nextTitle);
      setContent(nextContent);
      setBaseline({ title: nextTitle, content: nextContent });
    }
  }, [document?.id, document?.title, document?.content]);

  const isDirty =
    !readOnly &&
    (title !== baseline.title || content !== baseline.content);

  useEffect(() => {
    if (!closeInterceptorRef) {
      return;
    }
    closeInterceptorRef.current = () => {
      if (!isDirty) {
        return false;
      }
      setConfirmClose(true);
      return true;
    };
    return () => {
      closeInterceptorRef.current = null;
    };
  }, [closeInterceptorRef, isDirty]);

  const cannotSaveNewFile =
    !readOnly && documentId == null && !canCreateTextFile(documents);

  const onSave = () => {
    if (readOnly) {
      return;
    }
    if (cannotSaveNewFile) {
      showTextFileLimit();
      return;
    }
    saveDocumentFromWindow(windowId, title, content);
    setBaseline({ title: stripTextExtension(title), content });
    flashSaved();
  };

  const finishClose = () => {
    setConfirmClose(false);
    closeWindow(windowId);
  };

  const onSaveAndClose = () => {
    if (readOnly) {
      return;
    }
    if (cannotSaveNewFile) {
      showTextFileLimit();
      return;
    }
    saveDocumentFromWindow(windowId, title, content);
    finishClose();
  };

  const displayName = stripTextExtension(title) || "Untitled";
  const charCount = content.length;
  const atCharLimit = !readOnly && charCount >= MAX_TEXT_FILE_CHARS;

  const onContentChange = (next: string) => {
    if (readOnly) {
      return;
    }
    setContent(clampTextFileContent(next));
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-win-face">
      <div className="flex items-center gap-2 border-b border-win-dark px-2 py-1">
        {readOnly ? (
          <span className="text-win-dark">Read-only (visiting)</span>
        ) : (
          <button
            type="button"
            className="win-raised px-3 py-0.5"
            onClick={onSave}
          >
            Save
          </button>
        )}
        <label className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0">File name:</span>
          <input
            className="win-sunken min-w-0 flex-1 bg-win-paper py-0.5 pl-2 pr-1 text-win-ink outline-none"
            value={title}
            onChange={(event) =>
              setTitle(clampFileTitle(event.target.value))
            }
            spellCheck={false}
            readOnly={readOnly}
            maxLength={readOnly ? undefined : MAX_FILE_TITLE_CHARS}
          />
        </label>
        {savedFlash ? <span className="text-win-dark">Saved</span> : null}
      </div>
      {cannotSaveNewFile ? (
        <div
          className="shrink-0 border-b border-win-dark bg-[#ffffcc] px-2 py-1 text-[11px] text-win-ink"
          role="status"
        >
          You will not be able to save — you have reached the limit of{" "}
          {MAX_TEXT_FILES_PER_USER} text files ({textFileCount}/
          {MAX_TEXT_FILES_PER_USER}).
        </div>
      ) : null}
      <textarea
        className="win-sunken min-h-0 flex-1 resize-none bg-win-paper p-2 text-[12px] leading-5 text-win-ink outline-none"
        value={content}
        onChange={(event) => onContentChange(event.target.value)}
        placeholder={readOnly ? "" : "Write a poem or story..."}
        spellCheck={false}
        aria-label="Document content"
        readOnly={readOnly}
        maxLength={readOnly ? undefined : MAX_TEXT_FILE_CHARS}
      />
      <div
        className="flex shrink-0 justify-end border-t border-win-dark px-2 py-0.5 text-[11px] text-win-dark"
        aria-live="polite"
      >
        <span aria-label="Character count">
          {charCount}/{MAX_TEXT_FILE_CHARS}
          {atCharLimit ? " (limit reached)" : ""}
        </span>
      </div>
      {confirmClose ? (
        <ConfirmDialog
          title="Notepad"
          message={`The text in the ${displayName} file has changed.\n\nDo you want to save the changes?`}
          confirmLabel="Yes"
          discardLabel="No"
          onConfirm={onSaveAndClose}
          onDiscard={finishClose}
          onCancel={() => setConfirmClose(false)}
        />
      ) : null}
      {textFileLimitDialog}
    </div>
  );
}
