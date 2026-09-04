import {
  clearLocalSession,
  loadLocalSession,
  LOCAL_SESSION_STORAGE_KEY,
} from "@/lib/localSession";

/** Stub until Firebase Auth replaces mock sign-in. */
export const MOCK_SIGNED_IN_STORAGE_KEY = "personal-computer-mock-signed-in-v1";

export const OWN_PC_CHANGED_EVENT = "personal-computer-own-pc-changed";

/** True when the visitor has completed Setup or signed in. */
export function hasOwnPc(): boolean {
  return loadLocalSession() !== null || hasMockSignedIn();
}

export function notifyOwnPcChanged(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(OWN_PC_CHANGED_EVENT));
}

export function markMockSignedIn(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(MOCK_SIGNED_IN_STORAGE_KEY, "1");
  notifyOwnPcChanged();
}

export function hasMockSignedIn(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(MOCK_SIGNED_IN_STORAGE_KEY) === "1";
}

/** Clear stub session flags so the visitor is a guest again. */
export function clearOwnPcAccess(): void {
  if (typeof window === "undefined") {
    return;
  }
  clearLocalSession();
  window.localStorage.removeItem(MOCK_SIGNED_IN_STORAGE_KEY);
  notifyOwnPcChanged();
}

export { LOCAL_SESSION_STORAGE_KEY };
