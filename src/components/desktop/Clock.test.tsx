import { act, render, screen } from "@testing-library/react";
import { Clock } from "@/components/desktop/Clock";

describe("Clock", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-16T15:30:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the current time after mount", () => {
    render(<Clock />);
    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByText(/3:30/)).toBeInTheDocument();
  });
});
