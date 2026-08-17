import { redirect } from "next/navigation";
import { homePath } from "@/lib/seo/paths";

/**
 * Logged-in users land on their PC. When auth exists, unauthenticated
 * visitors should see a marketing / sign-up landing here instead.
 */
export default function Home() {
  redirect(homePath());
}
