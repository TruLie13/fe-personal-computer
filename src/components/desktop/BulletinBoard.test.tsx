import { render, screen, within } from "@testing-library/react";
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
    localStoryComments: [],
    localGuestbookEntries: [],
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
    expect(screen.getByText("Looking for readers")).toBeInTheDocument();
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

  it("shows Visit PC on other authors' pinned slips", () => {
    render(<BulletinBoard />);
    expect(
      screen.getAllByRole("button", { name: /Visit PC/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/Looking for brave readers/i),
    ).toBeInTheDocument();
  });

  it("hides Visit PC on your own post", () => {
    resetStore([
      {
        id: "local-1",
        authorId: LOCAL_USER_ID,
        title: "My own post",
        content: "hello from me",
        createdAt: "2026-08-20T12:00:00.000Z",
      },
    ]);
    render(<BulletinBoard />);

    const ownTitle = screen.getByText("My own post");
    const ownSlip = ownTitle.closest("li");
    expect(ownSlip).toBeTruthy();
    expect(
      within(ownSlip!).queryByRole("button", { name: /Visit PC/i }),
    ).not.toBeInTheDocument();
    expect(
      within(ownSlip!).getByRole("button", { name: "Delete My own post" }),
    ).toBeInTheDocument();
  });

  it("deletes your own post without refunding the daily limit", async () => {
    const user = userEvent.setup();
    const day = utcDayKey();
    resetStore(
      Array.from({ length: MAX_BBS_NOTES_PER_UTC_DAY }, (_, i) => ({
        id: `local-cap-${i}`,
        authorId: LOCAL_USER_ID,
        title: `Cap post ${i}`,
        content: "body",
        createdAt: `${day}T0${i}:00:00.000Z`,
      })),
    );
    render(<BulletinBoard />);

    await user.click(
      screen.getByRole("button", { name: "Delete Cap post 0" }),
    );

    const dialog = screen.getByRole("alertdialog", { name: "Bulletin Board" });
    expect(dialog).toHaveTextContent(/not refunded/i);
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(screen.queryByText("Cap post 0")).not.toBeInTheDocument();
    expect(
      useDesktopStore
        .getState()
        .localBbsNotes.find((post) => post.id === "local-cap-0")?.deletedAt,
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "New Post" }));
    expect(
      screen.getByRole("alertdialog", { name: "Bulletin Board" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/daily limit of 5 posts/i)).toBeInTheDocument();
  });

  it("renders a sunken post stack (not master-detail, not cork cards)", () => {
    const { container } = render(<BulletinBoard />);
    expect(container.querySelector(".win-bbs-cork")).toBeNull();
    expect(container.querySelector(".win-guestbook-wall")).toBeNull();
    expect(screen.getByText(/leave a post for the community/i)).toBeInTheDocument();
    expect(screen.getByText(/Looking for brave readers/i)).toBeInTheDocument();
  });
});
