/** Spoken brand (share copy, titles). */
export const SPOKEN_NAME = "Teal95";

/** Product name in UI chrome (Start menu, About, Setup). */
export const PRODUCT_NAME = "Teal95";

export const SITE_TITLE = `${SPOKEN_NAME} — A social desktop for writers`;

export const SITE_DESCRIPTION =
  `${SPOKEN_NAME} is a social desktop for writers. Your profile is a personal computer — write stories on your desktop, and let others visit your PC to read them.`;

/** Homepage hero — writers first; OS is the metaphor. */
export const LANDING_TAGLINE = "A social desktop for writers.";

export const LANDING_PITCH =
  "Write stories on your own PC. Save them as files on your desktop. Other people visit your computer to read — no algorithmic feed, just desktops on a quiet network.";

/** Next.js `metadata.title.template` — child titles become `{title} — Teal95`. */
export const TITLE_TEMPLATE = `%s — ${SPOKEN_NAME}`;

export function profileMetaTitle(displayName: string): string {
  const name = displayName.trim() || "User";
  return `${name}'s PC`;
}

export function fileMetaTitle(
  fileTitle: string,
  displayName: string,
): string {
  return `${fileTitle} — ${profileMetaTitle(displayName)}`;
}

export function notFoundMetaTitle(kind: "pc" | "file"): string {
  return kind === "pc" ? "PC not found" : "File not found";
}
