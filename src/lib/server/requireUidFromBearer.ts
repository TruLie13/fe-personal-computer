import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase/admin";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Verify `Authorization: Bearer <idToken>` and return the Auth uid. */
export async function requireUidFromBearer(
  request: Request,
): Promise<string> {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match?.[1]) {
    throw new UnauthorizedError("Missing bearer token");
  }
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(match[1]);
    if (!decoded.uid) {
      throw new UnauthorizedError("Invalid token");
    }
    return decoded.uid;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      throw err;
    }
    throw new UnauthorizedError("Invalid token");
  }
}
