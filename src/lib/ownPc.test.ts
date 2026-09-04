import {
  clearOwnPcAccess,
  hasMockSignedIn,
  hasOwnPc,
  markMockSignedIn,
  MOCK_SIGNED_IN_STORAGE_KEY,
} from "@/lib/ownPc";
import {
  LOCAL_SESSION_STORAGE_KEY,
  saveLocalSession,
} from "@/lib/localSession";

describe("ownPc", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("is false with no session or sign-in stub", () => {
    expect(hasOwnPc()).toBe(false);
    expect(hasMockSignedIn()).toBe(false);
  });

  it("is true after Setup saves a local session", () => {
    saveLocalSession({
      username: "ada",
      email: "ada@example.com",
      createdAt: new Date().toISOString(),
    });
    expect(hasOwnPc()).toBe(true);
    window.localStorage.removeItem(LOCAL_SESSION_STORAGE_KEY);
    expect(hasOwnPc()).toBe(false);
  });

  it("is true after mock sign-in", () => {
    markMockSignedIn();
    expect(hasMockSignedIn()).toBe(true);
    expect(hasOwnPc()).toBe(true);
    window.localStorage.removeItem(MOCK_SIGNED_IN_STORAGE_KEY);
    expect(hasOwnPc()).toBe(false);
  });

  it("clears stub access on sign out", () => {
    markMockSignedIn();
    saveLocalSession({
      username: "ada",
      email: "ada@example.com",
      createdAt: new Date().toISOString(),
    });
    clearOwnPcAccess();
    expect(hasOwnPc()).toBe(false);
  });
});
