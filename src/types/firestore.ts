/**
 * Firestore document shapes (MVP). See docs/db-agent.md.
 * Timestamps are stored as Firestore Timestamp in the DB; ISO strings at
 * repository boundaries until Admin SDK / converter layer lands.
 */

export interface FirestoreUserDoc {
  username: string;
  displayName: string;
  computerName: string;
  bio: string;
  avatarColor: string;
  avatarUrl: string | null;
  wallpaper: string;
  titleBarColor: string;
  contentDark: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreUsernameDoc {
  uid: string;
}

export interface FirestoreFileDoc {
  type: "text" | "folder";
  title: string;
  slug: string;
  content?: string;
  parentId: string | null;
  desktopX: number;
  desktopY: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreFavoriteDoc {
  targetUsername: string;
  createdAt: string;
}

export interface FirestoreBbsNoteDoc {
  authorUid: string;
  username: string;
  title: string;
  body: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface FirestoreStoryCommentDoc {
  documentId: string;
  ownerUid: string;
  authorUid: string;
  username: string;
  content: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface FirestoreGuestbookEntryDoc {
  hostUid: string;
  hostUsername: string;
  authorUid: string;
  username: string;
  content: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface FirestorePublicStoryDoc {
  ownerUid: string;
  username: string;
  fileId: string;
  slug: string;
  title: string;
  excerpt: string;
  updatedAt: string;
}
