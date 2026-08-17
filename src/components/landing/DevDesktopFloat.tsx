"use client";

import Link from "next/link";
import { homePath } from "@/lib/seo/paths";

/**
 * Local-dev only shortcut onto the stub owner desktop.
 * Hidden in production builds.
 */
export function DevDesktopFloat() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-3 right-3 z-[9999] font-sans text-[11px]">
      <Link
        href={homePath()}
        className="win-raised inline-block bg-win-face px-2 py-1 text-win-ink no-underline hover:bg-win-face-light"
      >
        Dev: open my PC
      </Link>
    </div>
  );
}
