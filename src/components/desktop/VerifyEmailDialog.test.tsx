import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  requestVerifyEmailDialog,
  VERIFY_EMAIL_DIALOG_DISMISS_KEY,
  VerifyEmailDialog,
} from "@/components/desktop/VerifyEmailDialog";
import {
  resendVerificationEmail,
  subscribeAuthState,
} from "@/lib/firebase/auth";
import { resetDesktopStore } from "@/test/resetDesktopStore";
import { useDesktopStore } from "@/store/desktopStore";

const subscribe = jest.mocked(subscribeAuthState);
const resend = jest.mocked(resendVerificationEmail);

function mockUnverifiedUser() {
  subscribe.mockImplementation((onChange) => {
    onChange({
      uid: "uid-1",
      email: "ada@example.com",
      emailVerified: false,
    } as never);
    return () => undefined;
  });
}

describe("VerifyEmailDialog", () => {
  beforeEach(() => {
    resetDesktopStore();
    sessionStorage.clear();
    subscribe.mockImplementation(() => () => undefined);
    resend.mockReset();
    resend.mockResolvedValue(undefined);
  });

  it("opens on the local desktop when e-mail is unverified", async () => {
    mockUnverifiedUser();
    render(<VerifyEmailDialog />);

    expect(
      await screen.findByRole("alertdialog", { name: "Verify E-mail" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Verify your e-mail to finish Setup/i),
    ).toBeInTheDocument();
  });

  it("does not auto-open while visiting another PC", async () => {
    mockUnverifiedUser();
    useDesktopStore.getState().visitRemotePc("maya");
    render(<VerifyEmailDialog />);

    await waitFor(() => {
      expect(subscribe).toHaveBeenCalled();
    });
    expect(
      screen.queryByRole("alertdialog", { name: "Verify E-mail" }),
    ).not.toBeInTheDocument();
  });

  it("reopens from requestVerifyEmailDialog after OK", async () => {
    const user = userEvent.setup();
    mockUnverifiedUser();
    render(<VerifyEmailDialog />);

    await screen.findByRole("alertdialog", { name: "Verify E-mail" });
    await user.click(screen.getByRole("button", { name: "OK" }));
    expect(
      screen.queryByRole("alertdialog", { name: "Verify E-mail" }),
    ).not.toBeInTheDocument();
    expect(sessionStorage.getItem(VERIFY_EMAIL_DIALOG_DISMISS_KEY)).toBe("1");

    requestVerifyEmailDialog();
    expect(
      await screen.findByRole("alertdialog", { name: "Verify E-mail" }),
    ).toBeInTheDocument();
  });

  it("resends verification mail without closing", async () => {
    const user = userEvent.setup();
    mockUnverifiedUser();
    render(<VerifyEmailDialog />);

    await screen.findByRole("alertdialog", { name: "Verify E-mail" });
    await user.click(screen.getByRole("button", { name: "Resend" }));
    await waitFor(() => {
      expect(resend).toHaveBeenCalledTimes(1);
    });
    expect(
      screen.getByRole("alertdialog", { name: "Verify E-mail" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Verification mail sent/i)).toBeInTheDocument();
  });

  it("stays closed when the account is already verified", async () => {
    subscribe.mockImplementation((onChange) => {
      onChange({
        uid: "uid-1",
        email: "ada@example.com",
        emailVerified: true,
      } as never);
      return () => undefined;
    });
    render(<VerifyEmailDialog />);

    await waitFor(() => {
      expect(subscribe).toHaveBeenCalled();
    });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
