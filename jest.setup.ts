import "@testing-library/jest-dom";

process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS = "false";

jest.mock("@/lib/firebase/auth", () => ({
  signUpWithEmail: jest.fn(),
  signInWithEmail: jest.fn(),
  signOutFirebase: jest.fn(async () => undefined),
  resendVerificationEmail: jest.fn(async () => undefined),
  subscribeAuthState: jest.fn(() => () => undefined),
  getCurrentAuthUser: jest.fn(() => null),
}));

jest.mock("@/lib/repository", () => ({
  getDesktopRepository: jest.fn(() => ({
    getUidForUsername: jest.fn(async () => null),
    claimUsernameAndCreateProfile: jest.fn(),
    loadDesktop: jest.fn(async () => null),
    listNetworkDirectory: jest.fn(async () => []),
    saveProfile: jest.fn(async () => undefined),
    saveTheme: jest.fn(async () => undefined),
    saveDesktopLayout: jest.fn(async () => undefined),
  })),
  getSocialRepository: jest.fn(() => ({
    loadFavorites: jest.fn(async () => []),
    addFavorite: jest.fn(async () => undefined),
    removeFavorite: jest.fn(async () => undefined),
    listBbsNotes: jest.fn(async () => []),
    createBbsNote: jest.fn(async () => ({
      id: "bbs-1",
      authorId: "ada",
      title: "t",
      content: "b",
      createdAt: new Date().toISOString(),
    })),
    softDeleteBbsNote: jest.fn(async () => true),
    listStoryComments: jest.fn(async () => []),
    createStoryComment: jest.fn(async () => ({
      id: "cmt-1",
      documentId: "doc-1",
      authorId: "ada",
      content: "hi",
      createdAt: new Date().toISOString(),
    })),
    softDeleteStoryComment: jest.fn(async () => true),
    listGuestbookEntries: jest.fn(async () => []),
    createGuestbookEntry: jest.fn(async () => ({
      id: "gb-1",
      hostUserId: "maya",
      authorId: "ada",
      content: "hi",
      createdAt: new Date().toISOString(),
    })),
    softDeleteGuestbookEntry: jest.fn(async () => true),
    listPublicStories: jest.fn(async () => []),
  })),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  notFound: jest.fn(),
}));

if (typeof Element !== "undefined") {
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = function setPointerCapture() {
      /* jsdom stub */
    };
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = function releasePointerCapture() {
      /* jsdom stub */
    };
  }
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = function hasPointerCapture() {
      return false;
    };
  }
}
