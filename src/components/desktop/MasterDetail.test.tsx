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
        header={<span>Board</span>}
        list={
          <ul>
            <MasterDetailListItem
              active
              onSelect={onSelect}
              title="First note"
              meta="Maya · today"
              subtitle="hello world"
            />
          </ul>
        }
        detail={
          <MasterDetailPane
            item={{
              title: "First note",
              authorLabel: "by Maya",
              content: "full body",
            }}
            emptyMessage="Select a post to read."
          />
        }
      />,
    );

    expect(screen.getByText("Board")).toBeInTheDocument();
    expect(screen.getByText("full body")).toBeInTheDocument();
    expect(screen.getByText("hello world")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /First note/i }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("shows empty detail message when nothing is selected", () => {
    render(
      <MasterDetail
        header={<span>Stories</span>}
        list={<p>No items</p>}
        detail={
          <MasterDetailPane item={null} emptyMessage="Select a story to read." />
        }
      />,
    );

    expect(screen.getByText("Select a story to read.")).toBeInTheDocument();
  });
});
