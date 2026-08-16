import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DesktopIcon } from "@/components/desktop/DesktopIcon";
import { resetDesktopStore } from "@/test/resetDesktopStore";
import { useDesktopStore } from "@/store/desktopStore";

describe("DesktopIcon", () => {
  beforeEach(() => {
    resetDesktopStore();
  });

  it("opens a window on double-click", async () => {
    const user = userEvent.setup();
    const icon = useDesktopStore.getState().icons.find((item) => item.id === "notepad")!;

    render(
      <DesktopIcon
        icon={icon}
        onRequestMenu={jest.fn()}
        onRequestDelete={jest.fn()}
      />,
    );

    await user.dblClick(screen.getByRole("button", { name: "Notepad" }));
    expect(
      useDesktopStore.getState().windows.some(
        (window) => window.iconId === "notepad" && window.isOpen,
      ),
    ).toBe(true);
  });

  it("requests a context menu with Open", async () => {
    const user = userEvent.setup();
    const onRequestMenu = jest.fn();
    const icon = useDesktopStore.getState().icons.find((item) => item.id === "notepad")!;

    render(
      <DesktopIcon
        icon={icon}
        onRequestMenu={onRequestMenu}
        onRequestDelete={jest.fn()}
      />,
    );

    await user.pointer({
      keys: "[MouseRight>]",
      target: screen.getByRole("button", { name: "Notepad" }),
    });

    expect(onRequestMenu).toHaveBeenCalled();
    const entries = onRequestMenu.mock.calls[0]![1] as Array<{
      id: string;
      label?: string;
    }>;
    expect(entries.some((entry) => entry.label === "Open")).toBe(true);
  });
});
