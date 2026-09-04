"use client";

import { signUpWithEmail } from "@/lib/firebase/auth";
import {
  clearLocalSocialCaches,
  resetSocialStoreState,
} from "@/lib/clearLocalSocialCaches";
import { getDesktopRepository } from "@/lib/repository";
import { applySignedInSession, normalizeUsername } from "@/lib/setupAccount";

export interface RegisterPcInput {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface RegisterPcResult {
  username: string;
  uid: string;
}

/** Auth sign-up + unique username claim + local session/profile. */
export async function registerPcAccount(
  input: RegisterPcInput,
): Promise<RegisterPcResult> {
  clearLocalSocialCaches();
  resetSocialStoreState();
  const username = normalizeUsername(input.username);
  const user = await signUpWithEmail({
    email: input.email,
    password: input.password,
  });
  const created = await getDesktopRepository().claimUsernameAndCreateProfile({
    uid: user.uid,
    username,
    email: input.email.trim(),
    displayName: input.displayName,
  });
  const desktop = await getDesktopRepository().loadDesktop(user.uid);
  applySignedInSession({
    username: created.username,
    email: user.email ?? input.email.trim(),
    profile: desktop?.profile ?? {
      displayName: created.displayName,
      computerName: created.computerName,
      bio: created.bio,
      avatarColor: created.avatarColor,
      avatarUrl: created.avatarUrl,
    },
    theme: desktop?.theme ?? {
      wallpaper: created.wallpaper,
      titleBarColor: created.titleBarColor,
      contentDark: created.contentDark,
    },
    fs: desktop
      ? { icons: desktop.icons, documents: desktop.documents }
      : undefined,
  });
  return { username: created.username, uid: user.uid };
}
