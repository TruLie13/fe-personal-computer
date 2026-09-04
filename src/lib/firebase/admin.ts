import {
  applicationDefault,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;
let db: Firestore | undefined;

/**
 * Firebase Admin for Next.js server routes (username check, SEO later).
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

  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    process.env.GCLOUD_PROJECT ??
    "teal95-176f5";

  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
    }
    if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
    }
    app = initializeApp({ projectId });
    return app;
  }

  try {
    app = initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  } catch {
    // Local without ADC: still init for project-scoped emulator-less reads
    // (will fail until GOOGLE_APPLICATION_CREDENTIALS is set).
    app = initializeApp({ projectId });
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
