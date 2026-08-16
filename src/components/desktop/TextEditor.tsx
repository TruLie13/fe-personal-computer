"use client";

import { useEffect, useState } from "react";
import { stripTextExtension } from "@/lib/storage";
import {
  selectActiveDocuments,
  useDesktopStore,
} from "@/store/desktopStore";

interface TextEditorProps {
  windowId: string;
  documentId: string | null;
}

function titleFromWindowTitle(windowTitle: string): string {
  return stripTextExtension(windowTitle.replace(/\s-\sNotepad$/, ""));
}

export function TextEditor({ windowId, documentId }: TextEditorProps) {
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

  const readOnly = viewMode === "remote";

  const [title, setTitle] = useState(
    stripTextExtension(document?.title ?? titleFromWindowTitle(windowTitle)),
  );
  const [content, setContent] = useState(document?.content ?? "");
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (document) {
      setTitle(stripTextExtension(document.title));
      setContent(document.content);
    }
  }, [document?.id, document?.title, document?.content]);

  const onSave = () => {
    if (readOnly) {
      return;
    }
    saveDocumentFromWindow(windowId, title, content);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1200);
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
            className="win-sunken min-w-0 flex-1 bg-white px-1 py-0.5 outline-none disabled:bg-win-face-light"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            spellCheck={false}
            disabled={readOnly}
            readOnly={readOnly}
          />
        </label>
        {savedFlash ? <span className="text-win-dark">Saved</span> : null}
      </div>
      <textarea
        className="win-sunken min-h-0 flex-1 resize-none bg-white p-2 text-[12px] leading-5 outline-none disabled:bg-win-face-light"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={readOnly ? "" : "Write a poem or story..."}
        spellCheck={false}
        aria-label="Document content"
        disabled={readOnly}
        readOnly={readOnly}
      />
    </div>
  );
}
