"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
  type Unsubscribe,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";

export type AuthUser = User;

export interface EmailPasswordInput {
  email: string;
  password: string;
}

/**
 * Create Auth user + send Firebase verification email.
 * Does not claim a username or write Firestore yet (see repository / Setup wiring).
 */
export async function signUpWithEmail(
  input: EmailPasswordInput,
): Promise<AuthUser> {
  const credential = await createUserWithEmailAndPassword(
    getClientAuth(),
    input.email.trim(),
    input.password,
  );
  await sendEmailVerification(credential.user);
  return credential.user;
}

export async function signInWithEmail(
  input: EmailPasswordInput,
): Promise<AuthUser> {
  const credential = await signInWithEmailAndPassword(
    getClientAuth(),
    input.email.trim(),
    input.password,
  );
  return credential.user;
}

export async function signOutFirebase(): Promise<void> {
  await firebaseSignOut(getClientAuth());
}

export async function resendVerificationEmail(): Promise<void> {
  const user = getClientAuth().currentUser;
  if (!user || user.emailVerified) {
    return;
  }
  await sendEmailVerification(user);
}

export function subscribeAuthState(
  onChange: (user: AuthUser | null) => void,
): Unsubscribe {
  return onAuthStateChanged(getClientAuth(), onChange);
}

export function getCurrentAuthUser(): AuthUser | null {
  return getClientAuth().currentUser;
}
