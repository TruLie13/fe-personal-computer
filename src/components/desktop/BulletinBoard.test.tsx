import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulletinBoard } from "@/components/desktop/BulletinBoard";
import {
  DEFAULT_DOCUMENTS,
  DEFAULT_ICONS,
  DEFAULT_TITLE_BAR_COLOR,
  DEFAULT_WALLPAPER,
} from "@/lib/storage";
import { useDesktopStore } from "@/store/desktopStore";

describe("BulletinBoard", () => {
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

  it("composes and posts a community note", async () => {
    const user = userEvent.setup();
    render(<BulletinBoard />);

    await user.click(screen.getByRole("button", { name: "New Note" }));
    await user.type(screen.getByLabelText("Title"), "Looking for readers");
    await user.type(
      screen.getByPlaceholderText(/Say hello/i),
      "Anyone want to swap poems?",
    );
    await user.click(screen.getByRole("button", { name: "Post" }));

    expect(useDesktopStore.getState().localBbsNotes).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: /Looking for readers/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Anyone want to swap poems?")).toBeInTheDocument();
  });
});
