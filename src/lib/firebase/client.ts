"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  type Auth,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import {
  FIREBASE_AUTH_EMULATOR_HOST,
  FIREBASE_AUTH_EMULATOR_PORT,
  FIRESTORE_EMULATOR_HOST,
  FIRESTORE_EMULATOR_PORT,
  getFirebaseWebConfig,
  useFirebaseEmulators,
} from "@/lib/firebase/config";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let authEmulatorConnected = false;
let firestoreEmulatorConnected = false;

function getApp(): FirebaseApp {
  if (!app) {
    app = getApps().length > 0 ? getApps()[0]! : initializeApp(getFirebaseWebConfig());
  }
  return app;
}

/** Browser Auth instance (lazy; client components only). */
export function getClientAuth(): Auth {
  if (!auth) {
    auth = getAuth(getApp());
    if (useFirebaseEmulators() && !authEmulatorConnected) {
      connectAuthEmulator(
        auth,
        `http://${FIREBASE_AUTH_EMULATOR_HOST}:${FIREBASE_AUTH_EMULATOR_PORT}`,
        { disableWarnings: true },
      );
      authEmulatorConnected = true;
    }
  }
  return auth;
}

/** Browser Firestore instance (lazy; client components only). */
export function getClientFirestore(): Firestore {
  if (!db) {
    db = getFirestore(getApp());
    if (useFirebaseEmulators() && !firestoreEmulatorConnected) {
      connectFirestoreEmulator(
        db,
        FIRESTORE_EMULATOR_HOST,
        FIRESTORE_EMULATOR_PORT,
      );
      firestoreEmulatorConnected = true;
    }
  }
  return db;
}
