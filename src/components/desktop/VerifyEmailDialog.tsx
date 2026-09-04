"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/desktop/ConfirmDialog";
import { useEmailVerification } from "@/hooks/useEmailVerification";
import { useFirebaseEmulators } from "@/lib/firebase/config";
import { useDesktopStore } from "@/store/desktopStore";

export const OPEN_VERIFY_EMAIL_EVENT = "personal-computer-open-verify-email";
export const VERIFY_EMAIL_DIALOG_DISMISS_KEY =
  "personal-computer-verify-email-dismissed-v1";

/** Re-open the verify-e-mail dialog (Start menu). */
export function requestVerifyEmailDialog() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(OPEN_VERIFY_EMAIL_EVENT));
}

function wasDismissedThisSession(): boolean {
  try {
    return sessionStorage.getItem(VERIFY_EMAIL_DIALOG_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function markDismissedThisSession() {
  try {
    sessionStorage.setItem(VERIFY_EMAIL_DIALOG_DISMISS_KEY, "1");
  } catch {
    // Private mode / blocked storage — dialog can still close.
  }
}

function verifyEmailMessage(status: string | null, emulators: boolean): string {
  const lines = ["Verify your e-mail to finish Setup."];
  if (emulators) {
    lines.push(
      "",
      "Open the emulator UI (localhost:4000) → Auth to send or mark verified.",
    );
  }
  if (status) {
    lines.push("", status);
  }
  return lines.join("\n");
}

export function VerifyEmailDialog() {
  const viewMode = useDesktopStore((state) => state.viewMode);
  const { needsVerification, resend, status } = useEmailVerification();
  const [open, setOpen] = useState(false);
  const emulators = useFirebaseEmulators();

  useEffect(() => {
    const onRequest = () => setOpen(true);
    window.addEventListener(OPEN_VERIFY_EMAIL_EVENT, onRequest);
    return () => window.removeEventListener(OPEN_VERIFY_EMAIL_EVENT, onRequest);
  }, []);

  useEffect(() => {
    if (!needsVerification) {
      setOpen(false);
      return;
    }
    if (viewMode !== "local" || wasDismissedThisSession()) {
      return;
    }
    setOpen(true);
  }, [needsVerification, viewMode]);

  if (!open || !needsVerification) {
    return null;
  }

  return (
    <ConfirmDialog
      title="Verify E-mail"
      message={verifyEmailMessage(status, emulators)}
      confirmLabel="Resend"
      cancelLabel="OK"
      onConfirm={() => {
        void resend();
      }}
      onCancel={() => {
        markDismissedThisSession();
        setOpen(false);
      }}
    />
  );
}
