import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulletinBoard } from "@/components/desktop/BulletinBoard";
import {
  MAX_BBS_NOTE_CHARS,
  MAX_BBS_NOTES_PER_UTC_DAY,
  utcDayKey,
} from "@/lib/bbsNotes";
import {
  DEFAULT_DOCUMENTS,
  DEFAULT_ICONS,
  DEFAULT_TITLE_BAR_COLOR,
  DEFAULT_WALLPAPER,
} from "@/lib/storage";
import { LOCAL_USER_ID } from "@/lib/networkSeed";
import { useDesktopStore } from "@/store/desktopStore";
import type { BbsPost } from "@/types/network";

function resetStore(localBbsNotes: BbsPost[] = []) {
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
    selectedIconIds: [],
    renamingIconId: null,
    isStartMenuOpen: false,
    nextZIndex: 1,
    hydrated: false,
    viewMode: "local",
    remoteUserId: null,
    favorites: [],
    localBbsNotes,
    localProfile: {
      displayName: "Writer",
      computerName: "WRITER-PC",
      bio: "test",
      avatarColor: "#000080",
      avatarUrl: null,
    },
  });
  window.localStorage.clear();
}

describe("BulletinBoard", () => {
  beforeEach(() => {
    resetStore();
  });

  it("composes and posts a community post", async () => {
    const user = userEvent.setup();
    render(<BulletinBoard />);

    await user.click(screen.getByRole("button", { name: "New Post" }));
    await user.type(screen.getByLabelText("Title"), "Looking for readers");
    await user.type(
      screen.getByPlaceholderText(/Say hello/i),
      "Anyone want to swap poems?",
    );
    expect(screen.getByLabelText("Character count")).toHaveTextContent(
      `Anyone want to swap poems?`.length + `/${MAX_BBS_NOTE_CHARS}`,
    );
    expect(screen.getByLabelText("Daily post count")).toHaveTextContent(
      `0/${MAX_BBS_NOTES_PER_UTC_DAY} today`,
    );
    await user.click(screen.getByRole("button", { name: "Post" }));

    expect(useDesktopStore.getState().localBbsNotes).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: /Looking for readers/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Anyone want to swap poems?")).toBeInTheDocument();
  });

  it("blocks body content beyond the character limit", async () => {
    const user = userEvent.setup();
    render(<BulletinBoard />);

    await user.click(screen.getByRole("button", { name: "New Post" }));
    const body = screen.getByLabelText("Post content");
    const overLimit = "x".repeat(MAX_BBS_NOTE_CHARS + 500);
    await user.click(body);
    await user.paste(overLimit);

    expect(body).toHaveValue("x".repeat(MAX_BBS_NOTE_CHARS));
    expect(screen.getByLabelText("Character count")).toHaveTextContent(
      `${MAX_BBS_NOTE_CHARS}/${MAX_BBS_NOTE_CHARS} (limit reached)`,
    );
  });

  it("shows a limit dialog when New Post is clicked at the daily cap", async () => {
    const user = userEvent.setup();
    const day = utcDayKey();
    const localBbsNotes: BbsPost[] = Array.from(
      { length: MAX_BBS_NOTES_PER_UTC_DAY },
      (_, i) => ({
        id: `bbs-cap-${i}`,
        authorId: LOCAL_USER_ID,
        title: `Post ${i}`,
        content: "body",
        createdAt: `${day}T0${i}:00:00.000Z`,
      }),
    );
    resetStore(localBbsNotes);

    render(<BulletinBoard />);
    await user.click(screen.getByRole("button", { name: "New Post" }));

    expect(
      screen.getByRole("alertdialog", { name: "Bulletin Board" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/daily limit of 5 posts \(5\/5\)/i),
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Say hello/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "OK" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
