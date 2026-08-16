import type { DesktopIcon, TextDocument } from "@/types/desktop";

export type NetworkUserId = string;

export interface RemoteDesktopSnapshot {
  wallpaper: string;
  titleBarColor: string;
  icons: DesktopIcon[];
  documents: TextDocument[];
}

export interface NetworkUser {
  id: NetworkUserId;
  displayName: string;
  computerName: string;
  snapshot: RemoteDesktopSnapshot;
}

/** Community reach-out note on the Bulletin Board (not a story file). */
export interface BbsPost {
  id: string;
  authorId: NetworkUserId;
  title: string;
  content: string;
  createdAt: string;
}

/** Public writing discoverable in Story Explorer without following the author. */
export interface PublicStory {
  id: string;
  authorId: NetworkUserId;
  documentId: string;
  title: string;
  content: string;
  publishedAt: string;
}

export interface FavoritePc {
  userId: NetworkUserId;
  addedAt: string;
}

export type DesktopViewMode = "local" | "remote";
