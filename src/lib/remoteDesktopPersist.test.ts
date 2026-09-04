import {
  flushPendingRemotePersists,
  flushRemoteDesktopLayoutSave,
  flushRemoteThemeSave,
  saveRemoteProfileNow,
  scheduleRemoteDesktopLayoutSave,
  scheduleRemoteThemeSave,
  withRemotePersistSuppressed,
} from "@/lib/remoteDesktopPersist";
import { getCurrentAuthUser, subscribeAuthState } from "@/lib/firebase/auth";
import { getDesktopRepository } from "@/lib/repository";
import { DEFAULT_LOCAL_PROFILE } from "@/lib/profile";
import { DEFAULT_DOCUMENTS, DEFAULT_ICONS } from "@/lib/storage";

jest.mock("@/lib/firebase/auth", () => ({
  getCurrentAuthUser: jest.fn(),
  subscribeAuthState: jest.fn(() => () => undefined),
}));

jest.mock("@/lib/repository", () => ({
  getDesktopRepository: jest.fn(),
}));

const getUser = jest.mocked(getCurrentAuthUser);
const subscribe = jest.mocked(subscribeAuthState);
const getRepo = jest.mocked(getDesktopRepository);

describe("remoteDesktopPersist", () => {
  const saveProfile = jest.fn(async () => undefined);
  const saveTheme = jest.fn(async () => undefined);
  const saveDesktopLayout = jest.fn(async () => undefined);

  beforeEach(() => {
    jest.useFakeTimers();
    saveProfile.mockClear();
    saveTheme.mockClear();
    saveDesktopLayout.mockClear();
    subscribe.mockClear();
    getUser.mockReturnValue({ uid: "uid-1" } as never);
    getRepo.mockReturnValue({
      saveProfile,
      saveTheme,
      saveDesktopLayout,
    } as never);
  });

  afterEach(() => {
    flushRemoteThemeSave();
    flushRemoteDesktopLayoutSave();
    jest.useRealTimers();
  });

  it("saves profile when signed in", async () => {
    await expect(saveRemoteProfileNow(DEFAULT_LOCAL_PROFILE)).resolves.toBe(
      "saved",
    );
    expect(saveProfile).toHaveBeenCalledWith("uid-1", DEFAULT_LOCAL_PROFILE);
  });

  it("skips profile save when suppressed; queues when signed out", async () => {
    const suppressed = await new Promise<string>((resolve) => {
      withRemotePersistSuppressed(() => {
        void saveRemoteProfileNow(DEFAULT_LOCAL_PROFILE).then(resolve);
      });
    });
    expect(suppressed).toBe("suppressed");
    expect(saveProfile).not.toHaveBeenCalled();

    getUser.mockReturnValue(null);
    await expect(saveRemoteProfileNow(DEFAULT_LOCAL_PROFILE)).resolves.toBe(
      "queued",
    );
    expect(saveProfile).not.toHaveBeenCalled();
    expect(subscribe).toHaveBeenCalled();

    getUser.mockReturnValue({ uid: "uid-1" } as never);
    flushPendingRemotePersists();
    await Promise.resolve();
    expect(saveProfile).toHaveBeenCalledWith("uid-1", DEFAULT_LOCAL_PROFILE);
  });

  it("debounces theme saves", () => {
    scheduleRemoteThemeSave({
      wallpaper: "#111111",
      titleBarColor: "#000080",
      contentDark: false,
    });
    scheduleRemoteThemeSave({
      wallpaper: "#222222",
      titleBarColor: "#000080",
      contentDark: true,
    });
    expect(saveTheme).not.toHaveBeenCalled();

    jest.advanceTimersByTime(400);
    expect(saveTheme).toHaveBeenCalledTimes(1);
    expect(saveTheme).toHaveBeenCalledWith("uid-1", {
      wallpaper: "#222222",
      titleBarColor: "#000080",
      contentDark: true,
    });
  });

  it("debounces desktop layout saves", () => {
    scheduleRemoteDesktopLayoutSave(DEFAULT_ICONS, DEFAULT_DOCUMENTS);
    scheduleRemoteDesktopLayoutSave(DEFAULT_ICONS, [
      {
        id: "doc-1",
        title: "A",
        slug: "a",
        content: "x",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    expect(saveDesktopLayout).not.toHaveBeenCalled();
    jest.advanceTimersByTime(500);
    expect(saveDesktopLayout).toHaveBeenCalledTimes(1);
    expect(saveDesktopLayout.mock.calls[0]?.[0]).toBe("uid-1");
    expect(saveDesktopLayout.mock.calls[0]?.[2]).toHaveLength(1);
  });
});
