import { redirect } from "next/navigation";
import { homePath } from "@/lib/seo/paths";

/** `/C/users` → current user's desktop. */
export default function UsersIndexPage() {
  redirect(homePath());
}
