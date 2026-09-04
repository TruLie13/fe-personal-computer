import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type Credential,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;
let db: Firestore | undefined;

function projectId(): string {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    process.env.GCLOUD_PROJECT ??
    "teal95-176f5"
  );
}

function useEmulators(): boolean {
  return process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
}

/**
 * Prefer explicit service-account JSON (Vercel/hosting), then ADC, then bare init.
 * Env (pick one):
 * - FIREBASE_SERVICE_ACCOUNT_JSON — raw JSON string
 * - FIREBASE_SERVICE_ACCOUNT_BASE64 — base64-encoded JSON
 * - GOOGLE_APPLICATION_CREDENTIALS — path (local ADC)
 */
export function parseServiceAccountFromEnv(): Record<string, unknown> | null {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    return JSON.parse(rawJson) as Record<string, unknown>;
  }
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
  if (b64) {
    const decoded = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(decoded) as Record<string, unknown>;
  }
  return null;
}

export function resolveAdminCredential(): Credential | undefined {
  const parsed = parseServiceAccountFromEnv();
  if (parsed) {
    return cert(parsed);
  }
  try {
    return applicationDefault();
  } catch {
    return undefined;
  }
}

/**
 * Firebase Admin for Next.js server routes (username check, SEO, quotas, layout).
 * Emulator: set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 (or rely on
 * NEXT_PUBLIC_USE_FIREBASE_EMULATORS).
 */
export function getAdminApp(): App {
  if (app) {
    return app;
  }
  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }

  const id = projectId();

  if (useEmulators()) {
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
    }
    if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
    }
    app = initializeApp({ projectId: id });
    return app;
  }

  const credential = resolveAdminCredential();
  if (credential) {
    app = initializeApp({ credential, projectId: id });
  } else {
    // Last resort — SEO/API calls fail until a service account is configured.
    app = initializeApp({ projectId: id });
  }
  return app;
}

export function getAdminFirestore(): Firestore {
  if (!db) {
    db = getFirestore(getAdminApp());
  }
  return db;
}

export async function adminUidForUsername(
  username: string,
): Promise<string | null> {
  const snap = await getAdminFirestore().doc(`usernames/${username}`).get();
  if (!snap.exists) {
    return null;
  }
  const uid = snap.data()?.uid;
  return typeof uid === "string" ? uid : null;
}
