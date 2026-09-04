import { render, screen } from "@testing-library/react";
import { LandingPage } from "@/components/landing/LandingPage";

describe("LandingPage", () => {
  it("leads with writers / social desktop positioning", () => {
    render(<LandingPage />);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      screen.getAllByText(/social desktop for writers/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/write stories on your own pc/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/do not need an account to visit/i),
    ).toBeInTheDocument();
  });

  it("links to sample PC, sign-in, and Setup", () => {
    render(<LandingPage />);
    const sample = screen.getAllByRole("link", { name: /sample pc|visit a sample pc|maya/i });
    expect(sample.length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /^sign in$/i })[0],
    ).toHaveAttribute("href", "/sign-in");
    expect(
      screen.getAllByRole("link", { name: /get your pc/i })[0],
    ).toHaveAttribute("href", "/setup");
  });
});
