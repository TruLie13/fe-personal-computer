import {
  BBS_NOTES_STORAGE_KEY,
  MAX_BBS_NOTE_CHARS,
  MAX_BBS_NOTES_PER_UTC_DAY,
} from "@/lib/bbsNotes";
import {
  FAVORITES_STORAGE_KEY,
  isFavorite,
  loadFavorites,
  saveFavorites,
} from "@/lib/favorites";
import {
  getNetworkUser,
  listPublicStoriesNewestFirst,
  LOCAL_USER_ID,
  mergeBbsPostsNewestFirst,
} from "@/lib/networkSeed";
import { PROFILE_STORAGE_KEY } from "@/lib/profile";
import {
  DEFAULT_DOCUMENTS,
  DEFAULT_ICONS,
  DEFAULT_TITLE_BAR_COLOR,
  DEFAULT_WALLPAPER,
  STORAGE_KEY,
} from "@/lib/storage";
import {
  selectActiveDocuments,
  selectActiveIcons,
  selectActiveTitleBarColor,
  selectActiveWallpaper,
  useDesktopStore,
} from "@/store/desktopStore";

describe("desktopStore network", () => {
  beforeEach(() => {
    useDesktopStore.setState({
      icons: DEFAULT_ICONS,
      documents: DEFAULT_DOCUMENTS,
      windows: [],
      documentWindowFifo: [],
      wallpaper: DEFAULT_WALLPAPER,
      titleBarColor: DEFAULT_TITLE_BAR_COLOR,
      contentDark: false,
      taskbarHeight: 36,
      selectedIconId: null,
      renamingIconId: null,
      isStartMenuOpen: false,
      nextZIndex: 1,
      hydrated: false,
      viewMode: "local",
      remoteUserId: null,
      favorites: [],
      localBbsNotes: [],
      localProfile: {
        displayName: "Writer",
        computerName: "WRITER-PC",
        bio: "test",
        avatarColor: "#000080",
        avatarUrl: null,
      },
    });
    window.localStorage.clear();
  });

  it("opens bulletin board, story explorer, and network windows", () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow("bulletin-board");
    openWindow("story-explorer");
    openWindow("network-neighborhood");

    const { windows } = useDesktopStore.getState();
    expect(windows.some((window) => window.type === "bbs" && window.isOpen)).toBe(
      true,
    );
    expect(
      windows.some((window) => window.type === "stories" && window.isOpen),
    ).toBe(true);
    expect(
      windows.some((window) => window.type === "network" && window.isOpen),
    ).toBe(true);
  });

  it("visits a remote PC, opens their profile bio, and exposes seed icons", () => {
    const maya = getNetworkUser("maya");
    expect(maya).toBeDefined();

    useDesktopStore.getState().visitRemotePc("maya");
    const state = useDesktopStore.getState();

    expect(state.viewMode).toBe("remote");
    expect(state.remoteUserId).toBe("maya");
    expect(state.windows.some((window) => window.type === "profile")).toBe(
      true,
    );
    expect(selectActiveWallpaper(state)).toBe(maya!.snapshot.wallpaper);
    expect(selectActiveIcons(state)).toEqual(maya!.snapshot.icons);
  });

  it("updates local profile name and desktop icon label", () => {
    useDesktopStore.getState().updateLocalProfile({
      displayName: "Truth",
      bio: "Hello from my PC.",
    });
    const state = useDesktopStore.getState();
    expect(state.localProfile.displayName).toBe("Truth");
    expect(
      state.icons.find((icon) => icon.id === "profile")?.label,
    ).toBe("Truth's PC");
  });

  it("adds and removes network favorites from profile actions", () => {
    useDesktopStore.getState().addFavorite("maya");
    expect(useDesktopStore.getState().favorites).toHaveLength(1);
    useDesktopStore.getState().removeFavorite("maya");
    expect(useDesktopStore.getState().favorites).toHaveLength(0);
  });

  it("returns home and restores local desktop selectors", () => {
    useDesktopStore.getState().visitRemotePc("rex");
    useDesktopStore.getState().openWindow("rex-file-readme");
    expect(useDesktopStore.getState().windows.some((w) => w.isOpen)).toBe(true);

    useDesktopStore.getState().goHome();
    const state = useDesktopStore.getState();
    expect(state.viewMode).toBe("local");
    expect(state.remoteUserId).toBeNull();
    expect(state.windows).toHaveLength(0);
    expect(selectActiveWallpaper(state)).toBe(DEFAULT_WALLPAPER);
    expect(selectActiveIcons(state)).toEqual(DEFAULT_ICONS);
  });

  it("deep-links a desktop-root file without opening a folder", () => {
    useDesktopStore.getState().applyDeepLink({
      username: "maya",
      fileSlug: "welcome",
    });
    const { windows } = useDesktopStore.getState();
    expect(useDesktopStore.getState().viewMode).toBe("remote");
    expect(windows.some((window) => window.type === "folder")).toBe(false);
    expect(
      windows.some(
        (window) =>
          window.isOpen &&
          window.documentId === "maya-doc-welcome" &&
          window.isFocused,
      ),
    ).toBe(true);
  });

  it("deep-links a file inside a folder and focuses the file", () => {
    useDesktopStore.getState().applyDeepLink({
      username: "maya",
      fileSlug: "window-seat",
    });
    const { windows } = useDesktopStore.getState();
    expect(
      windows.some(
        (window) =>
          window.isOpen && window.iconId === "maya-drafts" && window.type === "folder",
      ),
    ).toBe(true);
    const fileWindow = windows.find(
      (window) => window.documentId === "maya-doc-poem",
    );
    expect(fileWindow?.isOpen).toBe(true);
    expect(fileWindow?.isFocused).toBe(true);
  });

  it("still opens the file when parent folder id is missing", () => {
    const folderId = useDesktopStore.getState().createFolder("Box");
    const fileIconId = useDesktopStore.getState().createTextFile(
      folderId,
      "orphan-me",
    );
    expect(folderId).toBeTruthy();
    expect(fileIconId).toBeTruthy();

    const documentId = useDesktopStore
      .getState()
      .icons.find((icon) => icon.id === fileIconId)?.documentId;
    const slug = useDesktopStore
      .getState()
      .documents.find((doc) => doc.id === documentId)?.slug;
    expect(slug).toBeTruthy();

    useDesktopStore.setState((state) => ({
      icons: state.icons.map((icon) =>
        icon.id === fileIconId
          ? { ...icon, parentId: "missing-folder" }
          : icon,
      ),
    }));

    expect(() =>
      useDesktopStore.getState().applyDeepLink({
        username: LOCAL_USER_ID,
        fileSlug: slug!,
      }),
    ).not.toThrow();

    expect(
      useDesktopStore
        .getState()
        .windows.some(
          (window) =>
            window.isOpen && window.documentId === documentId && window.isFocused,
        ),
    ).toBe(true);
  });

  it("ignores unknown deep-link slugs without throwing", () => {
    expect(() =>
      useDesktopStore.getState().applyDeepLink({
        username: "maya",
        fileSlug: "does-not-exist",
      }),
    ).not.toThrow();
    expect(useDesktopStore.getState().viewMode).toBe("remote");
    expect(
      useDesktopStore
        .getState()
        .windows.some((window) => window.type === "text"),
    ).toBe(false);
  });

  it("blocks mutations while visiting a remote PC", () => {
    useDesktopStore.getState().visitRemotePc("maya");
    const before = useDesktopStore.getState().icons;

    expect(useDesktopStore.getState().createFolder()).toBeNull();
    expect(useDesktopStore.getState().createTextFile("maya-folder")).toBeNull();
    useDesktopStore.getState().setWallpaper("#112233");
    useDesktopStore.getState().deleteIcon("maya-file-welcome");

    const after = useDesktopStore.getState();
    expect(after.icons).toEqual(before);
    expect(after.wallpaper).toBe(DEFAULT_WALLPAPER);
  });

  it("persists favorites to localStorage", () => {
    useDesktopStore.getState().addFavorite("maya");
    useDesktopStore.getState().addFavorite("rex");
    useDesktopStore.getState().addFavorite("maya");

    let { favorites } = useDesktopStore.getState();
    expect(favorites).toHaveLength(2);
    expect(isFavorite(favorites, "maya")).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY)!)).toEqual(
      favorites,
    );

    useDesktopStore.getState().removeFavorite("maya");
    favorites = useDesktopStore.getState().favorites;
    expect(favorites).toHaveLength(1);
    expect(favorites[0]?.userId).toBe("rex");
    expect(loadFavorites()).toEqual(favorites);
  });

  it("posts a local bulletin note and merges with seed notes", () => {
    const id = useDesktopStore
      .getState()
      .postBbsNote("Hello board", "Just saying hi from my PC.");
    expect(id).toBeTruthy();

    const { localBbsNotes } = useDesktopStore.getState();
    expect(localBbsNotes).toHaveLength(1);
    expect(localBbsNotes[0]?.authorId).toBe(LOCAL_USER_ID);
    expect(
      JSON.parse(window.localStorage.getItem(BBS_NOTES_STORAGE_KEY)!),
    ).toEqual(localBbsNotes);

    const merged = mergeBbsPostsNewestFirst(localBbsNotes);
    expect(merged[0]?.id).toBe(id);
    expect(merged.length).toBeGreaterThan(1);
  });

  it("lists public stories with visitable authors", () => {
    const stories = listPublicStoriesNewestFirst();
    expect(stories.length).toBeGreaterThan(0);
    for (const story of stories) {
      expect(getNetworkUser(story.authorId)).toBeDefined();
      expect(story.content.length).toBeGreaterThan(0);
    }
  });

  it("loads favorites and bbs notes on hydrate", () => {
    saveFavorites([{ userId: "maya", addedAt: "2026-08-15T00:00:00.000Z" }]);
    window.localStorage.setItem(
      BBS_NOTES_STORAGE_KEY,
      JSON.stringify([
        {
          id: "bbs-local-1",
          authorId: LOCAL_USER_ID,
          title: "Saved note",
          content: "Persisted",
          createdAt: "2026-08-15T01:00:00.000Z",
        },
      ]),
    );
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        icons: DEFAULT_ICONS,
        documents: DEFAULT_DOCUMENTS,
        wallpaper: "#123456",
        titleBarColor: DEFAULT_TITLE_BAR_COLOR,
      }),
    );

    useDesktopStore.getState().hydrate();
    const state = useDesktopStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.wallpaper).toBe("#123456");
    expect(state.favorites).toEqual([
      { userId: "maya", addedAt: "2026-08-15T00:00:00.000Z" },
    ]);
    expect(state.localBbsNotes[0]?.title).toBe("Saved note");
  });

  it("opens a remote text file and exposes seed documents", () => {
    useDesktopStore.getState().visitRemotePc("maya");
    const maya = getNetworkUser("maya")!;

    expect(selectActiveDocuments(useDesktopStore.getState())).toEqual(
      maya.snapshot.documents,
    );
    expect(selectActiveTitleBarColor(useDesktopStore.getState())).toBe(
      maya.snapshot.titleBarColor,
    );

    useDesktopStore.getState().openWindow("maya-file-welcome");
    const { windows } = useDesktopStore.getState();
    const editor = windows.find(
      (window) => window.documentId === "maya-doc-welcome" && window.isOpen,
    );
    expect(editor).toBeDefined();
    expect(editor?.type).toBe("editor");
    expect(editor?.title).toBe("welcome - Notepad");
  });

  it("blocks live document edits while visiting a remote PC", () => {
    useDesktopStore.getState().visitRemotePc("maya");
    useDesktopStore.getState().openWindow("maya-file-welcome");
    const windowId = useDesktopStore
      .getState()
      .windows.find((window) => window.documentId === "maya-doc-welcome")!.id;

    useDesktopStore
      .getState()
      .updateDocumentContent(windowId, "tampered", "hacked");

    expect(
      selectActiveDocuments(useDesktopStore.getState()).find(
        (doc) => doc.id === "maya-doc-welcome",
      )?.content,
    ).toContain("You found my machine");
    expect(useDesktopStore.getState().documents).toEqual(DEFAULT_DOCUMENTS);
  });

  it("rejects empty bulletin board posts", () => {
    expect(useDesktopStore.getState().postBbsNote("  ", "body")).toBe("");
    expect(useDesktopStore.getState().postBbsNote("title", "  ")).toBe("");
    expect(useDesktopStore.getState().localBbsNotes).toHaveLength(0);
  });

  it("rejects bulletin posts after the UTC daily limit", () => {
    const day = new Date().toISOString().slice(0, 10);
    useDesktopStore.setState({
      localBbsNotes: Array.from(
        { length: MAX_BBS_NOTES_PER_UTC_DAY },
        (_, i) => ({
          id: `bbs-day-${i}`,
          authorId: LOCAL_USER_ID,
          title: `Note ${i}`,
          content: "body",
          createdAt: `${day}T12:0${i}:00.000Z`,
        }),
      ),
    });

    expect(
      useDesktopStore.getState().postBbsNote("One more", "Should fail"),
    ).toBe("");
    expect(useDesktopStore.getState().localBbsNotes).toHaveLength(
      MAX_BBS_NOTES_PER_UTC_DAY,
    );
  });

  it("clamps bulletin note body on post", () => {
    const id = useDesktopStore
      .getState()
      .postBbsNote("Long body", "y".repeat(MAX_BBS_NOTE_CHARS + 500));
    expect(id).toBeTruthy();
    expect(useDesktopStore.getState().localBbsNotes[0]?.content).toHaveLength(
      MAX_BBS_NOTE_CHARS,
    );
  });

  it("hydrates profile label and merges missing app icons", () => {
    window.localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({
        displayName: "Ada",
        computerName: "ADA-PC",
        bio: "Hello",
        avatarColor: "#008080",
        avatarUrl: null,
      }),
    );
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        icons: [
          {
            id: "profile",
            label: "Old Label",
            type: "profile",
            x: 16,
            y: 16,
          },
        ],
        documents: [],
        wallpaper: "#abcdef",
      }),
    );

    useDesktopStore.getState().hydrate();
    const state = useDesktopStore.getState();
    expect(state.localProfile.displayName).toBe("Ada");
    expect(state.localProfile.bio).toBe("Hello");
    expect(state.icons.find((icon) => icon.id === "profile")?.label).toBe(
      "Ada's PC",
    );
    expect(state.icons.some((icon) => icon.id === "notepad")).toBe(true);
    expect(state.icons.some((icon) => icon.id === "bulletin-board")).toBe(
      true,
    );
    expect(state.icons.some((icon) => icon.id === "network-neighborhood")).toBe(
      true,
    );
    expect(state.wallpaper).toBe("#abcdef");
  });

  it("falls back to defaults when desktop localStorage is corrupt", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not-valid-json");
    useDesktopStore.getState().hydrate();
    const state = useDesktopStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.wallpaper).toBe(DEFAULT_WALLPAPER);
    expect(state.icons).toEqual(DEFAULT_ICONS);
    expect(state.documents).toEqual(DEFAULT_DOCUMENTS);
  });

  it("does not re-hydrate after the first successful load", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        icons: DEFAULT_ICONS,
        documents: DEFAULT_DOCUMENTS,
        wallpaper: "#111111",
        titleBarColor: DEFAULT_TITLE_BAR_COLOR,
      }),
    );
    useDesktopStore.getState().hydrate();
    expect(useDesktopStore.getState().wallpaper).toBe("#111111");

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        icons: DEFAULT_ICONS,
        documents: DEFAULT_DOCUMENTS,
        wallpaper: "#222222",
        titleBarColor: DEFAULT_TITLE_BAR_COLOR,
      }),
    );
    useDesktopStore.getState().hydrate();
    expect(useDesktopStore.getState().wallpaper).toBe("#111111");
  });

  it("opens the remote profile via openProfile while visiting", () => {
    useDesktopStore.getState().visitRemotePc("maya");
    useDesktopStore.getState().goHome();
    useDesktopStore.getState().visitRemotePc("maya");
    useDesktopStore.setState({
      windows: [],
      documentWindowFifo: [],
      nextZIndex: 1,
    });

    useDesktopStore.getState().openProfile();
    const { windows } = useDesktopStore.getState();
    expect(
      windows.some(
        (window) =>
          window.type === "profile" &&
          window.iconId === "maya-profile" &&
          window.isOpen,
      ),
    ).toBe(true);
  });
});
