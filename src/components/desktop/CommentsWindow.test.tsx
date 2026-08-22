import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentsWindow } from "@/components/desktop/CommentsWindow";
import { resetDesktopStore } from "@/test/resetDesktopStore";
import { useDesktopStore } from "@/store/desktopStore";

describe("CommentsWindow", () => {
  beforeEach(() => {
    resetDesktopStore();
  });

  it("lists seed comments and posts a local one", async () => {
    const user = userEvent.setup();
    render(<CommentsWindow documentId="maya-doc-poem" />);

    expect(
      screen.getByText(/The bus window line stuck with me/i),
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Comment content"),
      "Quiet poem. Thank you.",
    );
    await user.click(screen.getByRole("button", { name: "Post" }));

    expect(screen.getByText("Quiet poem. Thank you.")).toBeInTheDocument();
    expect(useDesktopStore.getState().localStoryComments).toHaveLength(1);
  });

  it("reuses one Comments window per documentId", () => {
    const { openStoryComments } = useDesktopStore.getState();
    openStoryComments({
      documentId: "maya-doc-poem",
      storyTitle: "window-seat",
    });
    openStoryComments({
      documentId: "maya-doc-poem",
      storyTitle: "window-seat",
    });
    openStoryComments({
      documentId: "rex-doc-outline",
      storyTitle: "chapter-zero",
    });

    const commentWindows = useDesktopStore
      .getState()
      .windows.filter((window) => window.type === "comments" && window.isOpen);
    expect(commentWindows).toHaveLength(2);
    expect(
      commentWindows.filter((window) => window.documentId === "maya-doc-poem"),
    ).toHaveLength(1);
  });

  it("soft-deletes a comment without refunding the daily quota", async () => {
    const user = userEvent.setup();
    const day = new Date().toISOString().slice(0, 10);
    useDesktopStore.setState({
      localStoryComments: Array.from({ length: 20 }, (_, i) => ({
        id: `cmt-${i}`,
        documentId: "maya-doc-poem",
        authorId: "local",
        content: `comment ${i}`,
        createdAt: `${day}T${String(i).padStart(2, "0")}:00:00.000Z`,
      })),
    });
    render(<CommentsWindow documentId="maya-doc-poem" />);

    await user.click(screen.getAllByRole("button", { name: "Delete comment" })[0]!);
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(
      useDesktopStore.getState().localStoryComments.find((c) => c.id === "cmt-0")
        ?.deletedAt,
    ).toBeTruthy();
    expect(screen.queryByText("comment 0")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Comment content"), "one more");
    await user.click(screen.getByRole("button", { name: "Post" }));
    expect(
      screen.getByRole("alertdialog", { name: "Comments" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/daily limit of 20 comments/i)).toBeInTheDocument();
  });
});
