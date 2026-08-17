import {
  getNetworkUser,
  LOCAL_USER_ID,
  NETWORK_USERS,
} from "@/lib/networkSeed";
import { isReservedFileSlug } from "@/lib/seo/slugs";
import type { TextDocument } from "@/types/desktop";
import type { NetworkUser, NetworkUserId } from "@/types/network";

export interface PublicFileRecord {
  user: NetworkUser;
  document: TextDocument;
  iconId: string;
  parentId: string | null;
}

export function listPublicNetworkUsers(): NetworkUser[] {
  return NETWORK_USERS;
}

export function resolvePublicUser(
  username: string,
): NetworkUser | undefined {
  if (username === LOCAL_USER_ID) {
    return undefined;
  }
  return getNetworkUser(username);
}

export function resolvePublicFile(
  username: string,
  fileSlug: string,
): PublicFileRecord | undefined {
  if (isReservedFileSlug(fileSlug)) {
    return undefined;
  }
  const user = resolvePublicUser(username);
  if (!user) {
    return undefined;
  }
  const document = user.snapshot.documents.find(
    (doc) => doc.slug === fileSlug,
  );
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

export function findDocumentSlugForUser(
  userId: NetworkUserId,
  documentId: string,
): string | undefined {
  const user = getNetworkUser(userId);
  return user?.snapshot.documents.find((doc) => doc.id === documentId)?.slug;
}
