import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "@/components/desktop/ConfirmDialog";

describe("ConfirmDialog", () => {
  it("confirms and cancels via buttons", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConfirmDialog
        title="Confirm File Delete"
        message='Delete "draft"?'
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(
      screen.getByRole("alertdialog", { name: "Confirm File Delete" }),
    ).toBeInTheDocument();
    expect(screen.getByText('Delete "draft"?')).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Yes" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "No" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("cancels on Escape", async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();

    render(
      <ConfirmDialog
        title="Confirm"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />,
    );

    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("supports Yes / No / Cancel for unsaved changes", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onDiscard = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConfirmDialog
        title="Notepad"
        message="Save the changes?"
        confirmLabel="Yes"
        discardLabel="No"
        onConfirm={onConfirm}
        onDiscard={onDiscard}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "No" }));
    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("supports OK-only alert mode", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConfirmDialog
        title="Bulletin Board"
        message="Limit reached."
        confirmLabel="OK"
        showCancel={false}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "No" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "OK" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
