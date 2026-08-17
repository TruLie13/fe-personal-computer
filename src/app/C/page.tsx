import { redirect } from "next/navigation";
import { homePath } from "@/lib/seo/paths";

/** `/C` → current user's desktop. */
export default function DriveRootPage() {
  redirect(homePath());
}
