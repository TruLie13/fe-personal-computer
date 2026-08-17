import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockSignInForm } from "@/components/landing/MockSignInForm";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("MockSignInForm", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("submits to the local desktop stub", async () => {
    const user = userEvent.setup();
    render(<MockSignInForm />);
    await user.type(screen.getByLabelText(/email/i), "writer@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(push).toHaveBeenCalledWith("/C/users/local");
  });

  it("links new users to Setup", () => {
    render(<MockSignInForm />);
    expect(
      screen.getByRole("link", { name: /get your pc/i }),
    ).toHaveAttribute("href", "/setup");
  });
});
