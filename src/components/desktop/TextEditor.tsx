"use client";

import {
  useEffect,
  useState,
  type MutableRefObject,
} from "react";
import { ConfirmDialog } from "@/components/desktop/ConfirmDialog";
import { useSavedFlash } from "@/hooks/useSavedFlash";
import { stripTextExtension } from "@/lib/storage";
import {
  selectActiveDocuments,
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
  const initialContent = document?.content ?? "";

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [baseline, setBaseline] = useState({
    title: initialTitle,
    content: initialContent,
  });
  const [confirmClose, setConfirmClose] = useState(false);
  const { savedFlash, flashSaved } = useSavedFlash();

  useEffect(() => {
    if (document) {
      const nextTitle = stripTextExtension(document.title);
      const nextContent = document.content;
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

  const onSave = () => {
    if (readOnly) {
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
    saveDocumentFromWindow(windowId, title, content);
    finishClose();
  };

  const displayName = stripTextExtension(title) || "Untitled";

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
            onChange={(event) => setTitle(event.target.value)}
            spellCheck={false}
            readOnly={readOnly}
          />
        </label>
        {savedFlash ? <span className="text-win-dark">Saved</span> : null}
      </div>
      <textarea
        className="win-sunken min-h-0 flex-1 resize-none bg-win-paper p-2 text-[12px] leading-5 text-win-ink outline-none"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={readOnly ? "" : "Write a poem or story..."}
        spellCheck={false}
        aria-label="Document content"
        readOnly={readOnly}
      />
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
    </div>
  );
}
