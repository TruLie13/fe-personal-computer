"use client";

import { useGuestChrome } from "@/hooks/useGuestChrome";

export function GuestChromeBanner() {
  const { showGuestChrome, goToSetup, goToSignIn } = useGuestChrome();

  if (!showGuestChrome) {
    return null;
  }

  return (
    <div
      className="win-guest-bar win-sunken relative z-[100] mx-1 mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 px-2 py-1 text-[12px]"
      role="status"
      aria-live="polite"
    >
      <span>
        You are visiting as a guest (read-only).
      </span>
      <button
        type="button"
        className="win-raised px-2 py-0.5 font-bold"
        onClick={goToSetup}
      >
        Get your PC
      </button>
      <span>to write and publish, or</span>
      <button
        type="button"
        className="win-raised px-2 py-0.5"
        onClick={goToSignIn}
      >
        Sign in
      </button>
      <span>if you already have one.</span>
    </div>
  );
}
