/** Spoken brand (share copy, titles). Full product name stays "Personal Computer". */
export const SPOKEN_NAME = "MyPC";

export const PRODUCT_NAME = "Personal Computer";

export const SITE_TITLE = `${SPOKEN_NAME} — ${PRODUCT_NAME}`;

export const SITE_DESCRIPTION =
  `${SPOKEN_NAME} — a ${PRODUCT_NAME} for writers. Your desktop is your profile; visit others on the network.`;

/** Next.js `metadata.title.template` — child titles become `{title} — MyPC`. */
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
