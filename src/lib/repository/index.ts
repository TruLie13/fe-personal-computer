import type { DesktopRepository } from "@/lib/repository/DesktopRepository";
import { createFirestoreDesktopRepository } from "@/lib/repository/firestoreDesktopRepository";
import { createFirestoreSocialRepository } from "@/lib/repository/firestoreSocialRepository";
import type { SocialRepository } from "@/lib/repository/SocialRepository";

let cachedDesktop: DesktopRepository | null = null;
let cachedSocial: SocialRepository | null = null;

export function getDesktopRepository(): DesktopRepository {
  if (!cachedDesktop) {
    cachedDesktop = createFirestoreDesktopRepository();
  }
  return cachedDesktop;
}

export function getSocialRepository(): SocialRepository {
  if (!cachedSocial) {
    cachedSocial = createFirestoreSocialRepository();
  }
  return cachedSocial;
}
