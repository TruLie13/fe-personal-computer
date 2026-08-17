import { LandingPage } from "@/components/landing/LandingPage";

/**
 * Logged-out homepage (1995 web aesthetic).
 * Signed-in home remains `/C/users/{username}` once auth exists.
 */
export default function Home() {
  return <LandingPage />;
}
