import {
  FieldValue,
  Timestamp,
  type Query,
} from "firebase-admin/firestore";
import { CONTENT_LIMITS } from "@/lib/contentLimits";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  assertWithinDailyQuota,
  type SocialQuotaKind,
} from "@/lib/socialQuota";
import { utcDayKey, utcDayRange } from "@/lib/utcDay";

function dayBounds(now = new Date()) {
  return utcDayRange(utcDayKey(now));
}

async function countCreatesToday(
  collectionName: string,
  filters: Array<{ field: string; value: string }>,
  now = new Date(),
): Promise<number> {
  const { startIso, endExclusiveIso } = dayBounds(now);
  const start = Timestamp.fromDate(new Date(startIso));
  const end = Timestamp.fromDate(new Date(endExclusiveIso));

  let q: Query = getAdminFirestore().collection(collectionName);
  for (const filter of filters) {
    q = q.where(filter.field, "==", filter.value);
  }
  q = q.where("createdAt", ">=", start).where("createdAt", "<", end);

  const snap = await q.select().get();
  return snap.size;
}

export async function countBbsCreatesToday(
  authorUid: string,
  now = new Date(),
): Promise<number> {
  return countCreatesToday(
    "bbsNotes",
    [{ field: "authorUid", value: authorUid }],
    now,
  );
}

export async function countStoryCommentCreatesToday(
  authorUid: string,
  now = new Date(),
): Promise<number> {
  return countCreatesToday(
    "storyComments",
    [{ field: "authorUid", value: authorUid }],
    now,
  );
}

export async function countGuestbookSignsToday(
  authorUid: string,
  hostUid: string,
  now = new Date(),
): Promise<number> {
  return countCreatesToday(
    "guestbookEntries",
    [
      { field: "authorUid", value: authorUid },
      { field: "hostUid", value: hostUid },
    ],
    now,
  );
}

export async function assertSocialQuota(
  kind: SocialQuotaKind,
  used: number,
): Promise<void> {
  assertWithinDailyQuota(kind, used);
}

function clamp(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max);
}

export interface CreatedBbsNote {
  id: string;
  authorId: string;
  title: string;
  content: string;
  createdAt: string;
}

export async function adminCreateBbsNote(input: {
  authorUid: string;
  username: string;
  title: string;
  body: string;
}): Promise<CreatedBbsNote> {
  const used = await countBbsCreatesToday(input.authorUid);
  await assertSocialQuota("bbs", used);

  const title = clamp(input.title.trim(), CONTENT_LIMITS.bbsTitleChars);
  const body = clamp(input.body.trim(), CONTENT_LIMITS.bbsBodyChars);
  if (!title || !body) {
    throw new Error("Title and body are required");
  }

  const ref = getAdminFirestore().collection("bbsNotes").doc();
  const createdAt = new Date().toISOString();
  await ref.set({
    authorUid: input.authorUid,
    username: input.username,
    title,
    body,
    createdAt: FieldValue.serverTimestamp(),
    deletedAt: null,
  });

  return {
    id: ref.id,
    authorId: input.username,
    title,
    content: body,
    createdAt,
  };
}

export interface CreatedStoryComment {
  id: string;
  documentId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export async function adminCreateStoryComment(input: {
  authorUid: string;
  username: string;
  documentId: string;
  ownerUid: string;
  content: string;
}): Promise<CreatedStoryComment> {
  const used = await countStoryCommentCreatesToday(input.authorUid);
  await assertSocialQuota("storyComment", used);

  const content = clamp(
    input.content.trim(),
    CONTENT_LIMITS.storyCommentChars,
  );
  if (!content || !input.documentId || !input.ownerUid) {
    throw new Error("Comment content and story ids are required");
  }

  const ref = getAdminFirestore().collection("storyComments").doc();
  const createdAt = new Date().toISOString();
  await ref.set({
    documentId: input.documentId,
    ownerUid: input.ownerUid,
    authorUid: input.authorUid,
    username: input.username,
    content,
    createdAt: FieldValue.serverTimestamp(),
    deletedAt: null,
  });

  return {
    id: ref.id,
    documentId: input.documentId,
    authorId: input.username,
    content,
    createdAt,
  };
}

export interface CreatedGuestbookEntry {
  id: string;
  hostUserId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export async function adminCreateGuestbookEntry(input: {
  authorUid: string;
  username: string;
  hostUid: string;
  hostUsername: string;
  content: string;
}): Promise<CreatedGuestbookEntry> {
  if (input.authorUid === input.hostUid) {
    throw new Error("Cannot sign your own Guest Book");
  }

  const used = await countGuestbookSignsToday(
    input.authorUid,
    input.hostUid,
  );
  await assertSocialQuota("guestbook", used);

  const content = clamp(
    input.content.trim(),
    CONTENT_LIMITS.guestbookEntryChars,
  );
  if (!content || !input.hostUid || !input.hostUsername) {
    throw new Error("Host and content are required");
  }

  const ref = getAdminFirestore().collection("guestbookEntries").doc();
  const createdAt = new Date().toISOString();
  await ref.set({
    hostUid: input.hostUid,
    hostUsername: input.hostUsername,
    authorUid: input.authorUid,
    username: input.username,
    content,
    createdAt: FieldValue.serverTimestamp(),
    deletedAt: null,
  });

  return {
    id: ref.id,
    hostUserId: input.hostUsername,
    authorId: input.username,
    content,
    createdAt,
  };
}
