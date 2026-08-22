import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MasterDetail,
  MasterDetailListItem,
  MasterDetailPane,
} from "@/components/desktop/MasterDetail";

describe("MasterDetail", () => {
  it("renders header, list selection, and detail pane", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    render(
      <MasterDetail
        header={<span>Story Explorer</span>}
        list={
          <ul>
            <MasterDetailListItem
              active
              onSelect={onSelect}
              title="chapter-zero"
              meta="Rex · today"
              subtitle="hello world"
            />
          </ul>
        }
        detail={
          <MasterDetailPane
            item={{
              title: "chapter-zero",
              authorLabel: "by Rex",
              content: "full body",
            }}
            emptyMessage="Select a story to read."
          />
        }
      />,
    );

    expect(screen.getByText("Story Explorer")).toBeInTheDocument();
    expect(screen.getByText("full body")).toBeInTheDocument();
    expect(screen.getByText("hello world")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /chapter-zero/i }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("shows empty detail message when nothing is selected", () => {
    render(
      <MasterDetail
        header={<span>Story Explorer</span>}
        list={<p>No items</p>}
        detail={
          <MasterDetailPane item={null} emptyMessage="Select a story to read." />
        }
      />,
    );

    expect(screen.getByText("Select a story to read.")).toBeInTheDocument();
  });

  it("adds space under meta when a subtitle preview is present", () => {
    const { rerender } = render(
      <ul>
        <MasterDetailListItem
          active={false}
          onSelect={() => undefined}
          title="chapter-zero"
          meta="Rex Ortega · Aug 13"
          subtitle="CHAPTER ZERO A stranger inherits…"
        />
      </ul>,
    );

    const withSubtitle = screen.getByText("Rex Ortega · Aug 13");
    expect(withSubtitle.className).toContain("mb-1.5");

    rerender(
      <ul>
        <MasterDetailListItem
          active={false}
          onSelect={() => undefined}
          title="chapter-zero"
          meta="Rex Ortega · Aug 13"
        />
      </ul>,
    );
    const withoutSubtitle = screen.getByText("Rex Ortega · Aug 13");
    expect(withoutSubtitle.className).not.toContain("mb-1.5");
  });
});
