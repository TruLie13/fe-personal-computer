import type { DesktopIcon, TextDocument } from "@/types/desktop";

export type NetworkUserId = string;

export interface UserProfile {
  displayName: string;
  computerName: string;
  bio: string;
  /** Solid Win95-style avatar swatch (fallback chrome / future UI). */
  avatarColor: string;
  /** Optional profile picture URL; when missing, UI uses the computer icon. */
  avatarUrl: string | null;
}

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
  bio: string;
  avatarColor: string;
  avatarUrl: string | null;
  snapshot: RemoteDesktopSnapshot;
}

/** Community reach-out post on the Bulletin Board (not a story file). */
export interface BbsPost {
  id: string;
  authorId: NetworkUserId;
  title: string;
  content: string;
  createdAt: string;
  /** Soft-delete; still counts toward the UTC daily create quota. */
  deletedAt?: string;
}

/**
 * Flat comment on a story file (no nested replies).
 * Keyed by the story's `documentId` (same id across Story Explorer / Notepad).
 */
export interface StoryComment {
  id: string;
  documentId: string;
  authorId: NetworkUserId;
  content: string;
  createdAt: string;
  /** Soft-delete; author may delete. Does not refund UTC daily create quota. */
  deletedAt?: string;
}

/** Message left on a user's Guest Book (Myspace-style wall for that PC). */
export interface GuestbookEntry {
  id: string;
  /** Whose Guest Book this appears in. */
  hostUserId: NetworkUserId;
  authorId: NetworkUserId;
  content: string;
  createdAt: string;
  /** Soft-delete; host or author may delete. */
  deletedAt?: string;
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
