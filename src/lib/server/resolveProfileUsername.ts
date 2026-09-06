import { adminUidForUsername, getAdminFirestore } from "@/lib/firebase/admin";

export class ProfileUsernameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileUsernameError";
  }
}

/** Username for an Auth uid from `users/{uid}` — never trust the client body. */
export async function requireUsernameForUid(uid: string): Promise<string> {
  const snap = await getAdminFirestore().doc(`users/${uid}`).get();
  if (!snap.exists) {
    throw new ProfileUsernameError("Signed-in user has no profile");
  }
  const username = snap.data()?.username;
  if (typeof username !== "string" || !username.trim()) {
    throw new ProfileUsernameError("Signed-in user has no username");
  }
  return username;
}

/**
 * Resolve guestbook host from a host id (Auth uid or seed username).
 * Ignores client-supplied hostUsername labels.
 */
export async function resolveGuestbookHost(hostId: string): Promise<{
  hostUid: string;
  hostUsername: string;
}> {
  const trimmed = hostId.trim();
  if (!trimmed) {
    throw new ProfileUsernameError("Host is required");
  }

  const userSnap = await getAdminFirestore().doc(`users/${trimmed}`).get();
  if (userSnap.exists) {
    const username = userSnap.data()?.username;
    if (typeof username === "string" && username.trim()) {
      return { hostUid: trimmed, hostUsername: username };
    }
  }

  const mappedUid = await adminUidForUsername(trimmed);
  if (mappedUid) {
    return { hostUid: mappedUid, hostUsername: trimmed };
  }

  // Seed PCs (maya/rex) use username as the stable host id.
  return { hostUid: trimmed, hostUsername: trimmed };
}
