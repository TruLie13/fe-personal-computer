/**
 * @jest-environment node
 *
 * Run with Firestore emulator:
 *   npm run test:rules
 *
 * Skips automatically when FIRESTORE_EMULATOR_HOST is unset.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const PROJECT_ID = "teal95-rules-test";
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const describeRules = emulatorHost ? describe : describe.skip;

describeRules("firestore.rules (emulator)", () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync(join(process.cwd(), "firestore.rules"), "utf8"),
        host: "127.0.0.1",
        port: Number(String(emulatorHost).split(":")[1] ?? 8080),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  it("allows owner profile update within length caps", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/alice"), {
        username: "alice",
        displayName: "Alice",
        computerName: "ALICE-PC",
        bio: "hi",
        avatarColor: "#000080",
        avatarUrl: null,
        wallpaper: "#008080",
        titleBarColor: "#000080",
        contentDark: false,
        taskbarHeight: 36,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      });
    });

    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(
      updateDoc(doc(alice.firestore(), "users/alice"), {
        bio: "updated bio",
      }),
    );
  });

  it("rejects bio over the length cap", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/alice"), {
        username: "alice",
        displayName: "Alice",
        computerName: "ALICE-PC",
        bio: "hi",
        avatarColor: "#000080",
        avatarUrl: null,
        wallpaper: "#008080",
        titleBarColor: "#000080",
        contentDark: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      });
    });

    const alice = testEnv.authenticatedContext("alice");
    await assertFails(
      updateDoc(doc(alice.firestore(), "users/alice"), {
        bio: "x".repeat(501),
      }),
    );
  });

  it("denies client bbs create and allows author soft-delete only", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "bbsNotes/note1"), {
        authorUid: "alice",
        username: "alice",
        title: "Hello",
        body: "World",
        createdAt: new Date(),
        deletedAt: null,
      });
    });

    const alice = testEnv.authenticatedContext("alice");
    const bob = testEnv.authenticatedContext("bob");

    await assertFails(
      setDoc(doc(alice.firestore(), "bbsNotes/new"), {
        authorUid: "alice",
        username: "alice",
        title: "Nope",
        body: "Client create blocked",
        createdAt: new Date(),
        deletedAt: null,
      }),
    );

    await assertSucceeds(
      updateDoc(doc(alice.firestore(), "bbsNotes/note1"), {
        deletedAt: new Date(),
      }),
    );

    await assertFails(
      updateDoc(doc(bob.firestore(), "bbsNotes/note1"), {
        deletedAt: new Date(),
      }),
    );

    // Soft-delete must not edit body.
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "bbsNotes/note2"), {
        authorUid: "alice",
        username: "alice",
        title: "Hello",
        body: "World",
        createdAt: new Date(),
        deletedAt: null,
      });
    });
    await assertFails(
      updateDoc(doc(alice.firestore(), "bbsNotes/note2"), {
        body: "hacked",
        deletedAt: new Date(),
      }),
    );
  });

  it("allows host soft-delete on guestbook", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "guestbookEntries/g1"), {
        hostUid: "alice",
        hostUsername: "alice",
        authorUid: "bob",
        username: "bob",
        content: "Nice PC",
        createdAt: new Date(),
        deletedAt: null,
      });
    });

    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(
      updateDoc(doc(alice.firestore(), "guestbookEntries/g1"), {
        deletedAt: new Date(),
      }),
    );
    const snap = await getDoc(
      doc(alice.firestore(), "guestbookEntries/g1"),
    );
    expect(snap.exists()).toBe(true);
  });

  it("hides private text from guests but allows folders and public text", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "users/alice/files/documents"), {
        type: "folder",
        title: "Documents",
        slug: "documents",
        parentId: null,
        desktopX: 16,
        desktopY: 112,
        isPublic: false,
      });
      await setDoc(doc(db, "users/alice/files/pub-1"), {
        type: "text",
        title: "Public",
        slug: "public",
        content: "hello",
        parentId: "documents",
        desktopX: 16,
        desktopY: 16,
        isPublic: true,
      });
      await setDoc(doc(db, "users/alice/files/priv-1"), {
        type: "text",
        title: "Secret",
        slug: "secret",
        content: "classified",
        parentId: "documents",
        desktopX: 16,
        desktopY: 32,
        isPublic: false,
      });
    });

    const guest = testEnv.unauthenticatedContext();
    await assertSucceeds(
      getDoc(doc(guest.firestore(), "users/alice/files/documents")),
    );
    await assertSucceeds(
      getDoc(doc(guest.firestore(), "users/alice/files/pub-1")),
    );
    await assertFails(
      getDoc(doc(guest.firestore(), "users/alice/files/priv-1")),
    );

    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(
      getDoc(doc(alice.firestore(), "users/alice/files/priv-1")),
    );
  });

  it("allows Documents folder seed create but blocks other client file writes", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(
      setDoc(doc(alice.firestore(), "users/alice/files/documents"), {
        type: "folder",
        title: "Documents",
        slug: "documents",
        parentId: null,
        desktopX: 16,
        desktopY: 112,
        isPublic: false,
      }),
    );
    await assertFails(
      setDoc(doc(alice.firestore(), "users/alice/files/doc-1"), {
        type: "text",
        title: "Nope",
        slug: "nope",
        content: "x",
        parentId: "documents",
        desktopX: 16,
        desktopY: 16,
        isPublic: false,
      }),
    );
  });
});
