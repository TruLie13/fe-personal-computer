import { BBS_NOTES_STORAGE_KEY } from "@/lib/bbsNotes";
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
import {
  DEFAULT_DOCUMENTS,
  DEFAULT_ICONS,
  DEFAULT_TITLE_BAR_COLOR,
  DEFAULT_WALLPAPER,
  STORAGE_KEY,
} from "@/lib/storage";
import {
  selectActiveIcons,
  selectActiveWallpaper,
  useDesktopStore,
} from "@/store/desktopStore";

describe("desktopStore network", () => {
  beforeEach(() => {
    useDesktopStore.setState({
      icons: DEFAULT_ICONS,
      documents: DEFAULT_DOCUMENTS,
      windows: [],
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
    ).toBe("Truth's Computer");
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
});
