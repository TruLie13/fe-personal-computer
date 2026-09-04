"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase/client";
import type {
  DesktopRepository,
  NetworkDirectoryEntry,
} from "@/lib/repository/DesktopRepository";
import {
  defaultDocumentsFolderDoc,
  desktopFsToFileDocs,
  DOCUMENTS_FOLDER_ID,
  fileDocsToDesktopFs,
  parseFirestoreFileDoc,
} from "@/lib/repository/desktopFiles";
import { UsernameTakenError } from "@/lib/repository/UsernameTakenError";
import {
  parseUserDoc,
  profileFromUserDoc,
  userDocFromClaim,
} from "@/lib/repository/userDoc";
import type { DesktopIcon, TextDocument } from "@/types/desktop";
import type { FirestoreFileDoc } from "@/types/firestore";

export function createFirestoreDesktopRepository(): DesktopRepository {
  return {
    async getUidForUsername(username) {
      const snap = await getDoc(doc(getClientFirestore(), "usernames", username));
      if (!snap.exists()) {
        return null;
      }
      const uid = snap.data()?.uid;
      return typeof uid === "string" ? uid : null;
    },

    async claimUsernameAndCreateProfile(input) {
      const db = getClientFirestore();
      const usernameRef = doc(db, "usernames", input.username);
      const userRef = doc(db, "users", input.uid);
      const documentsRef = doc(
        db,
        "users",
        input.uid,
        "files",
        DOCUMENTS_FOLDER_ID,
      );
      const created = userDocFromClaim(input);
      const documentsFolder = defaultDocumentsFolderDoc();

      await runTransaction(db, async (tx) => {
        const taken = await tx.get(usernameRef);
        if (taken.exists()) {
          throw new UsernameTakenError();
        }
        tx.set(usernameRef, { uid: input.uid });
        tx.set(userRef, {
          ...created,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        tx.set(documentsRef, {
          type: documentsFolder.type,
          title: documentsFolder.title,
          slug: documentsFolder.slug,
          parentId: documentsFolder.parentId,
          desktopX: documentsFolder.desktopX,
          desktopY: documentsFolder.desktopY,
          isPublic: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      return created;
    },

    async loadDesktop(uid) {
      const db = getClientFirestore();
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) {
        return null;
      }
      const parsed = parseUserDoc(snap.data());
      if (!parsed) {
        return null;
      }

      const filesSnap = await getDocs(collection(db, "users", uid, "files"));
      const files: Array<{ id: string; data: FirestoreFileDoc }> = [];
      for (const fileSnap of filesSnap.docs) {
        const data = parseFirestoreFileDoc(fileSnap.data());
        if (data) {
          files.push({ id: fileSnap.id, data });
        }
      }
      const fs = fileDocsToDesktopFs(files);

      return {
        profile: profileFromUserDoc(parsed),
        username: parsed.username,
        theme: {
          wallpaper: parsed.wallpaper,
          titleBarColor: parsed.titleBarColor,
          contentDark: parsed.contentDark,
        },
        icons: fs.icons,
        documents: fs.documents,
      };
    },

    async listNetworkDirectory(max = 100) {
      const snap = await getDocs(collection(getClientFirestore(), "users"));
      const entries: NetworkDirectoryEntry[] = [];
      for (const userSnap of snap.docs) {
        const parsed = parseUserDoc(userSnap.data());
        if (!parsed) {
          continue;
        }
        entries.push({
          username: parsed.username,
          displayName: parsed.displayName,
          computerName: parsed.computerName,
          bio: parsed.bio,
          avatarColor: parsed.avatarColor,
          avatarUrl: parsed.avatarUrl,
        });
      }
      return entries
        .sort((a, b) =>
          a.username.localeCompare(b.username, undefined, {
            sensitivity: "base",
          }),
        )
        .slice(0, max);
    },

    async saveProfile(uid, profile) {
      await updateDoc(doc(getClientFirestore(), "users", uid), {
        displayName: profile.displayName,
        computerName: profile.computerName,
        bio: profile.bio,
        avatarColor: profile.avatarColor,
        avatarUrl: profile.avatarUrl,
        updatedAt: serverTimestamp(),
      });
    },

    async saveTheme(uid, theme) {
      await updateDoc(doc(getClientFirestore(), "users", uid), {
        wallpaper: theme.wallpaper,
        titleBarColor: theme.titleBarColor,
        contentDark: theme.contentDark,
        updatedAt: serverTimestamp(),
      });
    },

    async saveDesktopLayout(uid, icons, documents) {
      await writeDesktopFiles(uid, icons, documents);
    },
  };
}

async function writeDesktopFiles(
  uid: string,
  icons: DesktopIcon[],
  documents: TextDocument[],
): Promise<void> {
  const db = getClientFirestore();
  const filesCol = collection(db, "users", uid, "files");
  const existingSnap = await getDocs(filesCol);
  const desired = desktopFsToFileDocs(icons, documents);
  const userSnap = await getDoc(doc(db, "users", uid));
  const username =
    typeof userSnap.data()?.username === "string"
      ? userSnap.data()!.username
      : "user";
  const batch = writeBatch(db);
  const existingCreatedAt = new Map<string, unknown>();
  const existingWasPublic = new Set<string>();
  for (const existing of existingSnap.docs) {
    existingCreatedAt.set(existing.id, existing.data().createdAt);
    if (existing.data().isPublic === true) {
      existingWasPublic.add(existing.id);
    }
  }

  for (const [fileId, data] of desired) {
    const ref = doc(filesCol, fileId);
    const createdAt = existingCreatedAt.get(fileId) ?? serverTimestamp();
    batch.set(ref, {
      type: data.type,
      title: data.title,
      slug: data.slug,
      ...(data.type === "text" ? { content: data.content ?? "" } : {}),
      parentId: data.parentId,
      desktopX: data.desktopX,
      desktopY: data.desktopY,
      isPublic: data.isPublic,
      createdAt,
      updatedAt: serverTimestamp(),
    });

    if (data.type === "text") {
      const storyRef = doc(db, "publicStories", fileId);
      if (data.isPublic) {
        batch.set(storyRef, {
          ownerUid: uid,
          username,
          fileId,
          slug: data.slug,
          title: data.title,
          excerpt: publicStoryExcerpt(data.content ?? ""),
          updatedAt: serverTimestamp(),
        });
      } else if (existingWasPublic.has(fileId)) {
        // Only delete when unpublishing — missing publicStories docs fail rules.
        batch.delete(storyRef);
      }
    }
  }

  for (const existing of existingSnap.docs) {
    if (!desired.has(existing.id)) {
      batch.delete(existing.ref);
      if (
        existing.data().type === "text" &&
        existingWasPublic.has(existing.id)
      ) {
        batch.delete(doc(db, "publicStories", existing.id));
      }
    }
  }

  await batch.commit();
}

function publicStoryExcerpt(content: string): string {
  const flat = content.replace(/\s+/g, " ").trim();
  if (flat.length <= 200) {
    return flat;
  }
  return `${flat.slice(0, 199)}…`;
}
