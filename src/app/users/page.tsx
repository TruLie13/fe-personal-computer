import { redirect } from "next/navigation";
import { homePath } from "@/lib/seo/paths";

/** `/users` → current user's desktop. */
export default function UsersRootPage() {
  redirect(homePath());
}
