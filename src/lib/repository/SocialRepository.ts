import type {
  BbsPost,
  FavoritePc,
  GuestbookEntry,
  PublicStory,
  StoryComment,
} from "@/types/network";

/**
 * Social feeds (favorites, BBS, comments, guestbook).
 */
export interface SocialRepository {
  loadFavorites(uid: string): Promise<FavoritePc[]>;

  addFavorite(
    uid: string,
    targetUserId: string,
    targetUsername: string,
  ): Promise<void>;

  removeFavorite(uid: string, targetUserId: string): Promise<void>;

  listBbsNotes(limit?: number): Promise<BbsPost[]>;

  createBbsNote(input: {
    authorUid: string;
    username: string;
    title: string;
    body: string;
  }): Promise<BbsPost>;

  softDeleteBbsNote(input: {
    noteId: string;
    authorUid: string;
  }): Promise<boolean>;

  listStoryComments(documentId: string, limit?: number): Promise<StoryComment[]>;

  createStoryComment(input: {
    documentId: string;
    ownerUid: string;
    authorUid: string;
    username: string;
    content: string;
  }): Promise<StoryComment>;

  softDeleteStoryComment(input: {
    commentId: string;
    authorUid: string;
  }): Promise<boolean>;

  listGuestbookEntries(
    hostUserId: string,
    limit?: number,
  ): Promise<GuestbookEntry[]>;

  createGuestbookEntry(input: {
    hostUid: string;
    hostUsername: string;
    authorUid: string;
    username: string;
    content: string;
  }): Promise<GuestbookEntry>;

  softDeleteGuestbookEntry(input: {
    entryId: string;
    actorUid: string;
    asHost: boolean;
  }): Promise<boolean>;

  listPublicStories(limit?: number): Promise<PublicStory[]>;
}
