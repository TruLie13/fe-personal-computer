import { getAdminFirestore, adminUidForUsername } from "@/lib/firebase/admin";
import { computerLabel } from "@/lib/profile";
import {
  listPublicNetworkUsers as listSeedUsers,
  resolvePublicFile as resolveSeedFile,
  resolvePublicUser as resolveSeedUser,
  type PublicFileRecord,
} from "@/lib/seo/publicContent";
import {
  DEFAULT_TITLE_BAR_COLOR,
  DEFAULT_WALLPAPER,
  mergeAppIcons,
  PROFILE_ICON_ID,
} from "@/lib/storage";
import type { DesktopIcon, TextDocument } from "@/types/desktop";
import type { NetworkUser, PublicStory } from "@/types/network";

function timestampToIso(value: unknown): string {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

/** Seed users plus claimed Firestore profiles (best-effort). */
export async function listPublicNetworkUsersAdmin(): Promise<NetworkUser[]> {
  const seeds = listSeedUsers();
  try {
    const snap = await getAdminFirestore().collection("users").limit(200).get();
    const claimed: NetworkUser[] = [];
    for (const userDoc of snap.docs) {
      const data = userDoc.data();
      const username = typeof data.username === "string" ? data.username : null;
      if (!username || seeds.some((seed) => seed.id === username)) {
        continue;
      }
      claimed.push({
        id: username,
        displayName:
          typeof data.displayName === "string" ? data.displayName : username,
        computerName:
          typeof data.computerName === "string"
            ? data.computerName
            : `${username.toUpperCase()}-PC`,
        bio: typeof data.bio === "string" ? data.bio : "",
        avatarColor:
          typeof data.avatarColor === "string" ? data.avatarColor : "#000080",
        avatarUrl: typeof data.avatarUrl === "string" ? data.avatarUrl : null,
        snapshot: {
          wallpaper:
            typeof data.wallpaper === "string"
              ? data.wallpaper
              : DEFAULT_WALLPAPER,
          titleBarColor:
            typeof data.titleBarColor === "string"
              ? data.titleBarColor
              : DEFAULT_TITLE_BAR_COLOR,
          icons: mergeAppIcons([]),
          documents: [],
        },
      });
    }
    return [...seeds, ...claimed];
  } catch {
    return seeds;
  }
}

export async function resolvePublicUserAdmin(
  username: string,
): Promise<NetworkUser | undefined> {
  const seed = resolveSeedUser(username);
  if (seed) {
    return seed;
  }
  try {
    const uid = await adminUidForUsername(username);
    if (!uid) {
      return undefined;
    }
    const snap = await getAdminFirestore().doc(`users/${uid}`).get();
    if (!snap.exists) {
      return undefined;
    }
    const data = snap.data() ?? {};
    const filesSnap = await getAdminFirestore()
      .collection(`users/${uid}/files`)
      .get();
    const documents: TextDocument[] = [];
    const icons: DesktopIcon[] = [];
    for (const file of filesSnap.docs) {
      const fileData = file.data();
      if (fileData.type === "text") {
        documents.push({
          id: file.id,
          title:
            typeof fileData.title === "string" ? fileData.title : "Untitled",
          slug: typeof fileData.slug === "string" ? fileData.slug : file.id,
          content:
            typeof fileData.content === "string" ? fileData.content : "",
          createdAt: timestampToIso(fileData.createdAt),
          updatedAt: timestampToIso(fileData.updatedAt),
          isPublic: fileData.isPublic === true,
        });
        icons.push({
          id: `file-${file.id}`,
          label:
            typeof fileData.title === "string" ? fileData.title : "Untitled",
          type: "text",
          x: typeof fileData.desktopX === "number" ? fileData.desktopX : 16,
          y: typeof fileData.desktopY === "number" ? fileData.desktopY : 16,
          documentId: file.id,
          parentId:
            typeof fileData.parentId === "string" ? fileData.parentId : null,
        });
      } else if (fileData.type === "folder") {
        icons.push({
          id: file.id,
          label: typeof fileData.title === "string" ? fileData.title : "Folder",
          type: "folder",
          x: typeof fileData.desktopX === "number" ? fileData.desktopX : 16,
          y: typeof fileData.desktopY === "number" ? fileData.desktopY : 16,
          parentId:
            typeof fileData.parentId === "string" ? fileData.parentId : null,
        });
      }
    }
    const displayName =
      typeof data.displayName === "string" ? data.displayName : username;
    return {
      id: username,
      displayName,
      computerName:
        typeof data.computerName === "string"
          ? data.computerName
          : `${username.toUpperCase()}-PC`,
      bio: typeof data.bio === "string" ? data.bio : "",
      avatarColor:
        typeof data.avatarColor === "string" ? data.avatarColor : "#000080",
      avatarUrl: typeof data.avatarUrl === "string" ? data.avatarUrl : null,
      snapshot: {
        wallpaper:
          typeof data.wallpaper === "string"
            ? data.wallpaper
            : DEFAULT_WALLPAPER,
        titleBarColor:
          typeof data.titleBarColor === "string"
            ? data.titleBarColor
            : DEFAULT_TITLE_BAR_COLOR,
        icons: mergeAppIcons(
          icons.map((icon) =>
            icon.id === PROFILE_ICON_ID
              ? { ...icon, label: computerLabel(displayName) }
              : icon,
          ),
        ),
        documents,
      },
    };
  } catch {
    return undefined;
  }
}

export async function resolvePublicFileAdmin(
  username: string,
  fileSlug: string,
): Promise<PublicFileRecord | undefined> {
  const seed = resolveSeedFile(username, fileSlug);
  if (seed) {
    return seed;
  }
  const user = await resolvePublicUserAdmin(username);
  if (!user) {
    return undefined;
  }
  const document = user.snapshot.documents.find((doc) => doc.slug === fileSlug);
  if (!document) {
    return undefined;
  }
  const icon = user.snapshot.icons.find(
    (item) => item.type === "text" && item.documentId === document.id,
  );
  if (!icon) {
    return undefined;
  }
  return {
    user,
    document,
    iconId: icon.id,
    parentId: icon.parentId ?? null,
  };
}

export async function listPublicStoriesAdmin(
  max = 200,
): Promise<PublicStory[]> {
  try {
    const snap = await getAdminFirestore()
      .collection("publicStories")
      .orderBy("updatedAt", "desc")
      .limit(max)
      .get();
    return snap.docs.map((storyDoc) => {
      const data = storyDoc.data();
      return {
        id: storyDoc.id,
        authorId: typeof data.username === "string" ? data.username : "unknown",
        documentId: typeof data.fileId === "string" ? data.fileId : storyDoc.id,
        title: typeof data.title === "string" ? data.title : "Untitled",
        content: typeof data.excerpt === "string" ? data.excerpt : "",
        publishedAt: timestampToIso(data.updatedAt),
        slug: typeof data.slug === "string" ? data.slug : undefined,
      };
    });
  } catch {
    return [];
  }
}
