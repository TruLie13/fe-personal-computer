"use client";

import { sessionUsername } from "@/lib/localSession";
import { NETWORK_USERS } from "@/lib/networkSeed";
import { getDesktopRepository } from "@/lib/repository";
import type { NetworkDirectoryEntry } from "@/lib/repository/DesktopRepository";
import {
  DEFAULT_TITLE_BAR_COLOR,
  DEFAULT_WALLPAPER,
} from "@/lib/storage";
import type { NetworkUser } from "@/types/network";

/** Stub snapshot — Visit PC loads the real desktop from Firestore. */
export function networkUserFromDirectoryEntry(
  entry: NetworkDirectoryEntry,
): NetworkUser {
  return {
    id: entry.username,
    displayName: entry.displayName,
    computerName: entry.computerName,
    bio: entry.bio,
    avatarColor: entry.avatarColor,
    avatarUrl: entry.avatarUrl,
    snapshot: {
      wallpaper: DEFAULT_WALLPAPER,
      titleBarColor: DEFAULT_TITLE_BAR_COLOR,
      icons: [],
      documents: [],
    },
  };
}

/**
 * Seed PCs + claimed Firestore users for Entire Network.
 * Excludes the signed-in session username (shown as This PC).
 */
export async function pullNetworkNeighborhoodUsers(): Promise<NetworkUser[]> {
  const own = sessionUsername();
  const seedIds = new Set(NETWORK_USERS.map((user) => user.id));
  let claimed: NetworkDirectoryEntry[] = [];
  try {
    claimed = await getDesktopRepository().listNetworkDirectory();
  } catch {
    claimed = [];
  }

  const claimedUsers = claimed
    .filter((entry) => entry.username !== own && !seedIds.has(entry.username))
    .map(networkUserFromDirectoryEntry);

  return [...NETWORK_USERS, ...claimedUsers];
}
