"use client";

import { signInWithEmail } from "@/lib/firebase/auth";
import { getDesktopRepository } from "@/lib/repository";
import { applySignedInSession } from "@/lib/setupAccount";

export class ProfileMissingError extends Error {
  constructor() {
    super("No PC is set up for this account. Run Setup to claim a username.");
    this.name = "ProfileMissingError";
  }
}

export interface SignInPcResult {
  username: string;
  uid: string;
  emailVerified: boolean;
}

export async function signInToPc(input: {
  email: string;
  password: string;
}): Promise<SignInPcResult> {
  const user = await signInWithEmail(input);
  const desktop = await getDesktopRepository().loadDesktop(user.uid);
  if (!desktop) {
    throw new ProfileMissingError();
  }
  applySignedInSession({
    username: desktop.username,
    email: user.email ?? input.email.trim(),
    profile: desktop.profile,
    theme: desktop.theme,
    fs: {
      icons: desktop.icons,
      documents: desktop.documents,
    },
  });
  return {
    username: desktop.username,
    uid: user.uid,
    emailVerified: user.emailVerified,
  };
}
