import type { WindowType } from "@/types/desktop";

/**
 * Desktop icons / windows fall into two product kinds:
 * - `app` — system apps (BBS, Network, Story Explorer, Display, Profile, …)
 * - `document` — folders and text/Notepad windows (count toward the open-window cap)
 *
 * Future Paint / Photos should register as `app`.
 */
export type WindowKind = "app" | "document";

/** Max concurrent open folder + file/Notepad windows (apps excluded). */
export const MAX_OPEN_DOCUMENT_WINDOWS = 15;

export function windowKind(type: WindowType): WindowKind {
  switch (type) {
    case "folder":
    case "text":
    case "editor":
      return "document";
    default:
      return "app";
  }
}

export function countsTowardOpenDocumentCap(type: WindowType): boolean {
  return windowKind(type) === "document";
}
