import { render, screen } from "@testing-library/react";
import { LandingPage } from "@/components/landing/LandingPage";

describe("LandingPage", () => {
  it("leads with writers / social network positioning", () => {
    render(<LandingPage />);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      screen.getByText(/social network for writers/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/write stories on your own pc/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/do not need an account to visit/i),
    ).toBeInTheDocument();
  });

  it("links to sample PC and sign-in", () => {
    render(<LandingPage />);
    const sample = screen.getAllByRole("link", { name: /sample pc|visit a sample pc|maya/i });
    expect(sample.length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /sign in|get your pc/i }).length,
    ).toBeGreaterThan(0);
  });
});
