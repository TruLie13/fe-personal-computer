import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CONTENT_LIMITS } from "@/lib/contentLimits";

/**
 * Ensures firestore.rules length caps stay in lockstep with CONTENT_LIMITS.
 * Does not need the emulator.
 */
describe("firestore.rules ↔ CONTENT_LIMITS parity", () => {
  const rules = readFileSync(
    join(process.cwd(), "firestore.rules"),
    "utf8",
  );

  it("embeds profile / file / social length caps from CONTENT_LIMITS", () => {
    const expectedSnippets = [
      `stringMax(request.resource.data.displayName, ${CONTENT_LIMITS.displayNameChars})`,
      `stringMax(request.resource.data.computerName, ${CONTENT_LIMITS.computerNameChars})`,
      `stringMax(request.resource.data.bio, ${CONTENT_LIMITS.bioChars})`,
      `stringMax(request.resource.data.title, ${CONTENT_LIMITS.fileTitleChars})`,
      `request.resource.data.content.size() <= ${CONTENT_LIMITS.textFileChars}`,
      `request.resource.data.taskbarHeight >= ${CONTENT_LIMITS.taskbarHeightMin}`,
      `request.resource.data.taskbarHeight <= ${CONTENT_LIMITS.taskbarHeightMax}`,
    ];

    for (const snippet of expectedSnippets) {
      expect(rules).toContain(snippet);
    }
  });

  it("blocks client creates on quota-gated social collections", () => {
    expect(rules).toMatch(/match \/bbsNotes\/\{noteId\}[\s\S]*?allow create: if false/);
    expect(rules).toMatch(
      /match \/storyComments\/\{commentId\}[\s\S]*?allow create: if false/,
    );
    expect(rules).toMatch(
      /match \/guestbookEntries\/\{entryId\}[\s\S]*?allow create: if false/,
    );
  });

  it("keeps private text files owner-or-public and layout writes Admin-only", () => {
    expect(rules).toContain("resource.data.isPublic == true");
    expect(rules).toContain("resource.data.type == 'folder'");
    expect(rules).toContain("fileId == 'documents'");
    expect(rules).toMatch(
      /match \/files\/\{fileId\}[\s\S]*?allow update, delete: if false/,
    );
    expect(rules).toMatch(
      /match \/publicStories\/\{storyId\}[\s\S]*?allow create, update: if false/,
    );
  });

  it("requires onlySoftDelete for social updates", () => {
    expect(rules).toContain("function onlySoftDelete()");
    expect(rules).toContain("onlySoftDelete()");
  });
});
