import { FieldValue } from "firebase-admin/firestore";
import {
  assertDesktopFsWithinLimits,
  publicStoryExcerpt,
} from "@/lib/desktopFsLimits";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  desktopFsToFileDocs,
  DOCUMENTS_FOLDER_ID,
} from "@/lib/repository/desktopFiles";
import type { DesktopIcon, TextDocument } from "@/types/desktop";

/**
 * Persist a full desktop FS snapshot with count + length enforcement.
 * Bypasses Security Rules (Admin). Clients must call this via /api/desktop/layout.
 */
export async function adminSaveDesktopLayout(input: {
  uid: string;
  icons: DesktopIcon[];
  documents: TextDocument[];
}): Promise<void> {
  assertDesktopFsWithinLimits(input.icons, input.documents);

  const db = getAdminFirestore();
  const filesCol = db.collection("users").doc(input.uid).collection("files");
  const [existingSnap, userSnap] = await Promise.all([
    filesCol.get(),
    db.doc(`users/${input.uid}`).get(),
  ]);

  const username =
    typeof userSnap.data()?.username === "string"
      ? (userSnap.data()!.username as string)
      : "user";

  const desired = desktopFsToFileDocs(input.icons, input.documents);
  if (!desired.has(DOCUMENTS_FOLDER_ID)) {
    throw new Error("Documents folder is required");
  }

  const existingCreatedAt = new Map<string, unknown>();
  const existingWasPublic = new Set<string>();
  for (const existing of existingSnap.docs) {
    const createdAt = existing.data().createdAt;
    if (createdAt != null) {
      existingCreatedAt.set(existing.id, createdAt);
    }
    if (existing.data().isPublic === true) {
      existingWasPublic.add(existing.id);
    }
  }

  let batch = db.batch();
  let ops = 0;
  const commitIfNeeded = async (force = false) => {
    if (ops === 0) {
      return;
    }
    if (!force && ops < 400) {
      return;
    }
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for (const [fileId, data] of desired) {
    const ref = filesCol.doc(fileId);
    const createdAt =
      existingCreatedAt.get(fileId) ?? FieldValue.serverTimestamp();
    batch.set(ref, {
      type: data.type,
      title: data.title,
      slug: data.slug,
      ...(data.type === "text" ? { content: data.content ?? "" } : {}),
      parentId: data.parentId,
      desktopX: data.desktopX,
      desktopY: data.desktopY,
      isPublic: data.isPublic === true,
      createdAt,
      updatedAt: FieldValue.serverTimestamp(),
    });
    ops += 1;

    if (data.type === "text") {
      const storyRef = db.collection("publicStories").doc(fileId);
      if (data.isPublic) {
        batch.set(storyRef, {
          ownerUid: input.uid,
          username,
          fileId,
          slug: data.slug,
          title: data.title,
          excerpt: publicStoryExcerpt(data.content ?? ""),
          updatedAt: FieldValue.serverTimestamp(),
        });
        ops += 1;
      } else if (existingWasPublic.has(fileId)) {
        batch.delete(storyRef);
        ops += 1;
      }
    }

    await commitIfNeeded();
  }

  for (const existing of existingSnap.docs) {
    if (desired.has(existing.id)) {
      continue;
    }
    batch.delete(existing.ref);
    ops += 1;
    if (
      existing.data().type === "text" &&
      existingWasPublic.has(existing.id)
    ) {
      batch.delete(db.collection("publicStories").doc(existing.id));
      ops += 1;
    }
    await commitIfNeeded();
  }

  await commitIfNeeded(true);
}
