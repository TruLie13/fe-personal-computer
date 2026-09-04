import {
  analyzingStatus,
  applyLocalSetupAccount,
  applySignedInSession,
  emailError,
  loadLocalSession,
  LOCAL_SESSION_STORAGE_KEY,
  normalizeUsername,
  passwordError,
  usernameError,
  userInfoError,
} from "@/lib/setupAccount";
import { PROFILE_STORAGE_KEY } from "@/lib/profile";
import { resetDesktopStore } from "@/test/resetDesktopStore";
import { useDesktopStore } from "@/store/desktopStore";

describe("setupAccount", () => {
  beforeEach(() => {
    resetDesktopStore();
  });

  it("normalizes and validates username", () => {
    expect(normalizeUsername("  Ada ")).toBe("ada");
    expect(usernameError("")).toBe("Type a username.");
    expect(usernameError("1ada")).toBe("Username must start with a letter.");
    expect(usernameError("a")).toMatch(/2–20/);
    expect(usernameError("Ada_99")).toBeNull();
  });

  it("validates email and password", () => {
    expect(emailError("")).toBe("Type an e-mail address.");
    expect(emailError("nope")).toBe("Type a valid e-mail address.");
    expect(emailError("ada@example.com")).toBeNull();
    expect(passwordError("")).toBe("Type a password.");
    expect(passwordError("short")).toBe(
      "Password must be at least 6 characters.",
    );
    expect(passwordError("secret1")).toBeNull();
  });

  it("returns the first user-info error", () => {
    expect(
      userInfoError({ username: "", email: "", password: "" }),
    ).toBe("Type a username.");
    expect(
      userInfoError({
        username: "ada",
        email: "bad",
        password: "secret1",
      }),
    ).toBe("Type a valid e-mail address.");
  });

  it("maps analyzing progress to setup copy", () => {
    expect(analyzingStatus(0)).toMatch(/user folder/i);
    expect(analyzingStatus(40)).toMatch(/notepad/i);
    expect(analyzingStatus(60)).toMatch(/network/i);
    expect(analyzingStatus(90)).toMatch(/starting/i);
    expect(analyzingStatus(100)).toMatch(/complete/i);
  });

  it("applies profile identity and a stub session without storing a password", () => {
    applyLocalSetupAccount({
      username: "Ada",
      email: "ada@example.com",
      displayName: "Ada",
    });

    const profile = useDesktopStore.getState().localProfile;
    expect(profile.displayName).toBe("Ada");
    expect(profile.computerName).toBe("ADA-PC");

    const session = loadLocalSession();
    expect(session).toEqual({
      username: "ada",
      email: "ada@example.com",
      createdAt: expect.any(String),
    });

    const rawSession = window.localStorage.getItem(LOCAL_SESSION_STORAGE_KEY);
    expect(rawSession).not.toMatch(/secret|password/i);
    expect(window.localStorage.getItem(PROFILE_STORAGE_KEY)).toContain("Ada");
  });

  it("applies theme when provided on signed-in session", () => {
    applySignedInSession({
      username: "ada",
      email: "ada@example.com",
      profile: { displayName: "Ada", bio: "from cloud" },
      theme: {
        wallpaper: "#123456",
        titleBarColor: "#654321",
        contentDark: true,
      },
    });

    const state = useDesktopStore.getState();
    expect(state.localProfile.bio).toBe("from cloud");
    expect(state.wallpaper).toBe("#123456");
    expect(state.titleBarColor).toBe("#654321");
    expect(state.contentDark).toBe(true);
  });

  it("merges Firestore files onto the desktop while keeping app icons", () => {
    applySignedInSession({
      username: "ada",
      email: "ada@example.com",
      profile: { displayName: "Ada" },
      fs: {
        icons: [
          {
            id: "documents",
            label: "Documents",
            type: "folder",
            x: 16,
            y: 112,
          },
          {
            id: "file-doc-1",
            label: "Cloud Note",
            type: "text",
            x: 200,
            y: 40,
            documentId: "doc-1",
            parentId: null,
          },
        ],
        documents: [
          {
            id: "doc-1",
            title: "Cloud Note",
            slug: "cloud-note",
            content: "from firestore",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      },
    });

    const state = useDesktopStore.getState();
    expect(state.documents).toEqual([
      expect.objectContaining({ id: "doc-1", content: "from firestore" }),
    ]);
    expect(state.icons.some((icon) => icon.id === "notepad")).toBe(true);
    expect(
      state.icons.some(
        (icon) => icon.documentId === "doc-1" && icon.label === "Cloud Note",
      ),
    ).toBe(true);
  });

  it("returns null for missing or corrupt session data", () => {
    expect(loadLocalSession()).toBeNull();
    window.localStorage.setItem(LOCAL_SESSION_STORAGE_KEY, "{not json");
    expect(loadLocalSession()).toBeNull();
  });
});
