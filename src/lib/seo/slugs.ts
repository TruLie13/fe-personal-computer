/** Path segments reserved under `/C/users/[username]/…` (not issuable as file slugs). */
export const RESERVED_FILE_SLUGS = new Set([
  "desktop",
  "settings",
  "edit",
  "f",
  "api",
  "new",
  "profile",
  "favorites",
  "network",
  "bbs",
  "stories",
]);

export function slugifyTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/\.txt$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "untitled";
}

export function isReservedFileSlug(slug: string): boolean {
  return RESERVED_FILE_SLUGS.has(slug.toLowerCase());
}

/**
 * Pick a unique slug for a document within one user's document set.
 * Existing slugs in `taken` are skipped; reserved names get a numeric suffix.
 */
export function uniqueDocumentSlug(
  title: string,
  taken: Iterable<string>,
  excludeSlug?: string | null,
): string {
  const takenSet = new Set(
    [...taken].map((slug) => slug.toLowerCase()).filter(Boolean),
  );
  if (excludeSlug) {
    takenSet.delete(excludeSlug.toLowerCase());
  }

  let candidate = slugifyTitle(title);
  if (isReservedFileSlug(candidate)) {
    candidate = `${candidate}-file`;
  }

  if (!takenSet.has(candidate)) {
    return candidate;
  }

  let n = 2;
  while (takenSet.has(`${candidate}-${n}`)) {
    n += 1;
  }
  return `${candidate}-${n}`;
}

export function ensureDocumentSlugs<
  T extends { title: string; slug?: string },
>(documents: T[]): Array<T & { slug: string }> {
  const taken: string[] = [];
  return documents.map((doc) => {
    const existing =
      typeof doc.slug === "string" && doc.slug.trim() ? doc.slug.trim() : null;
    if (
      existing &&
      !isReservedFileSlug(existing) &&
      !taken.some((slug) => slug.toLowerCase() === existing.toLowerCase())
    ) {
      taken.push(existing);
      return { ...doc, slug: existing };
    }
    const slug = uniqueDocumentSlug(doc.title, taken);
    taken.push(slug);
    return { ...doc, slug };
  });
}
