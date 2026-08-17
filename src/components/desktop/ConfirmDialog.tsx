"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** When set, shows a third action (e.g. Notepad “Don't Save”). */
  onDiscard?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  discardLabel?: string;
}

export function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  onDiscard,
  confirmLabel = "Yes",
  cancelLabel = "No",
  discardLabel = "No",
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const threeWay = typeof onDiscard === "function";

  useEffect(() => {
    confirmRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[40000] flex items-center justify-center bg-black/20"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        className="win-window flex w-[360px] max-w-[90vw] flex-col p-[2px]"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="win-titlebar">
          <span id="confirm-dialog-title" className="min-w-0 flex-1 truncate">
            {title}
          </span>
          <button
            type="button"
            className="win-title-btn"
            aria-label="Close"
            onClick={onCancel}
          >
            ×
          </button>
        </div>
        <div className="flex gap-3 p-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center border border-win-black bg-win-face text-[18px] font-bold"
            aria-hidden="true"
          >
            !
          </div>
          <p
            id="confirm-dialog-message"
            className="whitespace-pre-wrap text-[12px] leading-5"
          >
            {message}
          </p>
        </div>
        <div className="flex justify-center gap-3 pb-3">
          <button
            ref={confirmRef}
            type="button"
            className="win-raised min-w-[75px] px-4 py-1"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          {threeWay ? (
            <button
              type="button"
              className="win-raised min-w-[75px] px-4 py-1"
              onClick={onDiscard}
            >
              {discardLabel}
            </button>
          ) : null}
          <button
            type="button"
            className="win-raised min-w-[75px] px-4 py-1"
            onClick={onCancel}
          >
            {threeWay ? "Cancel" : cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
