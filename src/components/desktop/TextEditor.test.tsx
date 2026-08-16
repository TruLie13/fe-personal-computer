import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextEditor } from "@/components/desktop/TextEditor";
import {
  DEFAULT_DOCUMENTS,
  DEFAULT_ICONS,
  DEFAULT_TITLE_BAR_COLOR,
  DEFAULT_WALLPAPER,
} from "@/lib/storage";
import { useDesktopStore } from "@/store/desktopStore";

function resetStore() {
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
}

describe("TextEditor", () => {
  beforeEach(() => {
    resetStore();
  });

  it("saves a new document from the Notepad UI", async () => {
    const user = userEvent.setup();
    useDesktopStore.getState().openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]!.id;

    render(<TextEditor windowId={windowId} documentId={null} />);

    const titleInput = screen.getByDisplayValue("Untitled");
    await user.clear(titleInput);
    await user.type(titleInput, "sonnet");
    await user.type(
      screen.getByLabelText("Document content"),
      "shall I compare thee",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    const { documents, icons } = useDesktopStore.getState();
    expect(documents).toHaveLength(1);
    expect(documents[0]?.title).toBe("sonnet");
    expect(documents[0]?.content).toBe("shall I compare thee");
    expect(icons.some((icon) => icon.label === "sonnet")).toBe(true);
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("is read-only when visiting a remote PC", () => {
    useDesktopStore.getState().visitRemotePc("maya");
    useDesktopStore.getState().openWindow("maya-file-welcome");
    const editor = useDesktopStore
      .getState()
      .windows.find((window) => window.documentId === "maya-doc-welcome")!;

    render(
      <TextEditor windowId={editor.id} documentId={editor.documentId} />,
    );

    expect(screen.getByText("Read-only (visiting)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Document content")).toBeDisabled();
    expect(screen.getByDisplayValue("welcome")).toBeDisabled();
    expect(
      (screen.getByLabelText("Document content") as HTMLTextAreaElement).value,
    ).toContain("You found my machine");
  });
});
