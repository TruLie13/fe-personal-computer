"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { apiSaveDesktopLayout } from "@/lib/desktopLayoutApi";
import { getClientFirestore } from "@/lib/firebase/client";
import type {
  DesktopRepository,
  NetworkDirectoryEntry,
} from "@/lib/repository/DesktopRepository";
import {
  defaultDocumentsFolderDoc,
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
        // Only client-allowed file create: seed Documents folder (see rules).
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

      // Guests only receive public texts + folders (private ACL in rules).
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
          ...(parsed.taskbarHeight !== undefined
            ? { taskbarHeight: parsed.taskbarHeight }
            : {}),
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
        ...(theme.taskbarHeight !== undefined
          ? { taskbarHeight: theme.taskbarHeight }
          : {}),
        updatedAt: serverTimestamp(),
      });
    },

    async saveDesktopLayout(_uid, icons, documents) {
      // Count + length enforced server-side; Auth uid comes from the bearer token.
      await apiSaveDesktopLayout({ icons, documents });
    },
  };
}
