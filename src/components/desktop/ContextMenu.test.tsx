import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContextMenu } from "@/components/desktop/ContextMenu";

describe("ContextMenu", () => {
  it("runs onSelect and closes for a simple item", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    const onClose = jest.fn();

    render(
      <ContextMenu
        x={40}
        y={40}
        onClose={onClose}
        entries={[
          { id: "open", label: "Open", onSelect },
          { id: "sep", separator: true },
          { id: "rename", label: "Rename", onSelect: jest.fn() },
        ]}
      />,
    );

    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "Open" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("opens a submenu and selects a nested item", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    const onClose = jest.fn();

    render(
      <ContextMenu
        x={20}
        y={20}
        onClose={onClose}
        entries={[
          {
            id: "new",
            label: "New",
            submenu: [{ id: "new-folder", label: "Folder", onSelect }],
          },
        ]}
      />,
    );

    await user.hover(screen.getByRole("menuitem", { name: /New/ }));
    await user.click(screen.getByRole("menuitem", { name: "Folder" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <ContextMenu
        x={10}
        y={10}
        onClose={onClose}
        entries={[{ id: "open", label: "Open", onSelect: jest.fn() }]}
      />,
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
