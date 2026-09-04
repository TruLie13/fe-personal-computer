import type { FirestoreUserDoc } from "@/types/firestore";
import type { UserProfile } from "@/types/network";
import type {
  DesktopIcon,
  TextDocument,
} from "@/types/desktop";

/** Theme fields persisted with the user profile. */
export interface DesktopThemeState {
  wallpaper: string;
  titleBarColor: string;
  contentDark: boolean;
}

export interface DesktopLoadResult {
  profile: UserProfile;
  username: string;
  theme: DesktopThemeState;
  icons: DesktopIcon[];
  documents: TextDocument[];
}

/** Lightweight PC row for Network Neighborhood (no full desktop snapshot). */
export interface NetworkDirectoryEntry {
  username: string;
  displayName: string;
  computerName: string;
  bio: string;
  avatarColor: string;
  avatarUrl: string | null;
}

export interface ClaimUsernameInput {
  uid: string;
  username: string;
  email: string;
  displayName: string;
}

/**
 * Persistence boundary for signed-in desktops.
 * Local stub stays until cutover; Firestore impl lands behind this interface.
 */
export interface DesktopRepository {
  /** Resolve `usernames/{username}` → uid (null if free / missing). */
  getUidForUsername(username: string): Promise<string | null>;

  /**
   * Atomically claim `usernames/{username}` and create `users/{uid}`.
   * Call after Firebase Auth sign-up (Auth uid is the document id).
   */
  claimUsernameAndCreateProfile(
    input: ClaimUsernameInput,
  ): Promise<FirestoreUserDoc>;

  loadDesktop(uid: string): Promise<DesktopLoadResult | null>;

  /** Claimed PCs for Entire Network (public `users` docs). */
  listNetworkDirectory(limit?: number): Promise<NetworkDirectoryEntry[]>;

  saveProfile(uid: string, profile: UserProfile): Promise<void>;

  saveTheme(uid: string, theme: DesktopThemeState): Promise<void>;

  saveDesktopLayout(
    uid: string,
    icons: DesktopIcon[],
    documents: TextDocument[],
  ): Promise<void>;
}
