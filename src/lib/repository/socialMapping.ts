import type { SocialRepository } from "@/lib/repository/SocialRepository";

/**
 * Pure helpers for social Firestore ↔ FE mapping (unit-tested without Firebase).
 */
export function favoriteFromFirestoreDoc(
  targetUserId: string,
  createdAtIso: string,
): { userId: string; addedAt: string } {
  return { userId: targetUserId, addedAt: createdAtIso };
}

export function bbsPostFromFirestoreFields(input: {
  id: string;
  username: string;
  title: string;
  body: string;
  createdAt: string;
  deletedAt?: string | null;
}) {
  return {
    id: input.id,
    authorId: input.username,
    title: input.title,
    content: input.body,
    createdAt: input.createdAt,
    ...(input.deletedAt ? { deletedAt: input.deletedAt } : {}),
  };
}

export type { SocialRepository };
