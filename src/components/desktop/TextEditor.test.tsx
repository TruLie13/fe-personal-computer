import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextEditor } from "@/components/desktop/TextEditor";
import {
  NOTEPAD_DRAFTS_STORAGE_KEY,
  saveNotepadDraft,
} from "@/lib/notepadDrafts";
import {
  DEFAULT_DOCUMENTS,
  DEFAULT_ICONS,
  DEFAULT_TITLE_BAR_COLOR,
  DEFAULT_WALLPAPER,
  MAX_TEXT_FILE_CHARS,
  MAX_TEXT_FILES_PER_USER,
} from "@/lib/storage";
import { useDesktopStore } from "@/store/desktopStore";
import { seedTextFilesInStore } from "@/test/seedTextFiles";

function resetStore() {
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

  it("restores an unsaved draft from localStorage", async () => {
    useDesktopStore.getState().openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]!.id;
    saveNotepadDraft({
      windowId: "gone-after-refresh",
      documentId: null,
      title: "draft-title",
      content: "recovered lines",
    });

    render(<TextEditor windowId={windowId} documentId={null} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("draft-title")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Document content")).toHaveValue(
      "recovered lines",
    );
    expect(window.localStorage.getItem(NOTEPAD_DRAFTS_STORAGE_KEY)).toContain(
      windowId,
    );
  });

  it("persists dirty edits to localStorage while typing", async () => {
    const user = userEvent.setup();
    useDesktopStore.getState().openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]!.id;

    render(<TextEditor windowId={windowId} documentId={null} />);
    await user.type(screen.getByLabelText("Document content"), "hello draft");

    await waitFor(() => {
      expect(window.localStorage.getItem(NOTEPAD_DRAFTS_STORAGE_KEY)).toContain(
        "hello draft",
      );
    });
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
    const content = screen.getByLabelText(
      "Document content",
    ) as HTMLTextAreaElement;
    const title = screen.getByDisplayValue("welcome") as HTMLInputElement;
    // readOnly (not disabled) so contentDark / bg-win-paper still applies when visiting
    expect(content).toHaveAttribute("readonly");
    expect(title).toHaveAttribute("readonly");
    expect(content).not.toBeDisabled();
    expect(title).not.toBeDisabled();
    expect(content.className).toContain("bg-win-paper");
    expect(content.value).toContain("You found my machine");
  });

  it("prompts before closing with unsaved changes", async () => {
    const user = userEvent.setup();
    useDesktopStore.getState().openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]!.id;
    const closeInterceptorRef = { current: null as (() => boolean) | null };

    render(
      <TextEditor
        windowId={windowId}
        documentId={null}
        closeInterceptorRef={closeInterceptorRef}
      />,
    );

    await user.type(
      screen.getByLabelText("Document content"),
      "unsaved verse",
    );

    act(() => {
      expect(closeInterceptorRef.current?.()).toBe(true);
    });
    expect(
      await screen.findByRole("alertdialog", { name: "Notepad" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "No" }));
    expect(
      useDesktopStore.getState().windows.find((item) => item.id === windowId)
        ?.isOpen,
    ).toBe(false);
  });

  it("saves empty content when confirming Yes on close", async () => {
    const user = userEvent.setup();
    useDesktopStore.getState().openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]!.id;
    const closeInterceptorRef = { current: null as (() => boolean) | null };

    render(
      <TextEditor
        windowId={windowId}
        documentId={null}
        closeInterceptorRef={closeInterceptorRef}
      />,
    );

    const titleInput = screen.getByDisplayValue("Untitled");
    await user.clear(titleInput);
    await user.type(titleInput, "blank-page");

    act(() => {
      expect(closeInterceptorRef.current?.()).toBe(true);
    });
    await user.click(
      await screen.findByRole("button", { name: "Yes" }),
    );

    const { documents, windows } = useDesktopStore.getState();
    expect(documents.some((doc) => doc.title === "blank-page" && doc.content === "")).toBe(
      true,
    );
    expect(windows.find((item) => item.id === windowId)?.isOpen).toBe(false);
  });

  it("shows the character count as current/max", () => {
    useDesktopStore.getState().openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]!.id;

    render(<TextEditor windowId={windowId} documentId={null} />);

    expect(
      screen.getByLabelText("Character count"),
    ).toHaveTextContent(`0/${MAX_TEXT_FILE_CHARS}`);
  });

  it("blocks content beyond the character limit", async () => {
    useDesktopStore.getState().openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]!.id;

    render(<TextEditor windowId={windowId} documentId={null} />);

    const content = screen.getByLabelText(
      "Document content",
    ) as HTMLTextAreaElement;
    const overLimit = "x".repeat(MAX_TEXT_FILE_CHARS + 500);

    fireEvent.change(content, { target: { value: overLimit } });

    expect(content.value).toHaveLength(MAX_TEXT_FILE_CHARS);
    expect(
      screen.getByLabelText("Character count"),
    ).toHaveTextContent(
      `${MAX_TEXT_FILE_CHARS}/${MAX_TEXT_FILE_CHARS} (limit reached)`,
    );
  });

  it("shows a banner and limit popup when saving a new file at the text file limit", async () => {
    const user = userEvent.setup();
    seedTextFilesInStore();
    useDesktopStore.getState().openWindow("notepad");
    const windowId = useDesktopStore.getState().windows[0]!.id;

    render(<TextEditor windowId={windowId} documentId={null} />);

    expect(
      screen.getByRole("status"),
    ).toHaveTextContent(
      `You will not be able to save — you have reached the limit of ${MAX_TEXT_FILES_PER_USER} text files (${MAX_TEXT_FILES_PER_USER}/${MAX_TEXT_FILES_PER_USER}).`,
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(
      screen.getByRole("alertdialog", { name: "New Text Document" }),
    ).toBeInTheDocument();
  });

  it("still allows saving an existing text file when at the file limit", async () => {
    const user = userEvent.setup();
    seedTextFilesInStore();
    const existingDocumentId =
      useDesktopStore.getState().documents[0]?.id ?? null;
    expect(existingDocumentId).toBeTruthy();

    useDesktopStore.getState().openWindow(`file-${existingDocumentId}`);
    const editor = useDesktopStore
      .getState()
      .windows.find((window) => window.documentId === existingDocumentId)!;

    render(
      <TextEditor
        windowId={editor.id}
        documentId={editor.documentId}
      />,
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();

    await user.type(screen.getByLabelText("Document content"), "!");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      useDesktopStore.getState().documents[0]?.content,
    ).toContain("!");
  });
});
