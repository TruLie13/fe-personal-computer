import type {
  BbsPost,
  NetworkUser,
  NetworkUserId,
  PublicStory,
} from "@/types/network";

export const LOCAL_USER_ID = "local";

export const NETWORK_USERS: NetworkUser[] = [
  {
    id: "maya",
    displayName: "Maya Chen",
    computerName: "MAYA-PC",
    bio: "Poet of buses, rain, and bad pianos.\n\nI keep drafts in purple. Say hi on the Bulletin Board if you like quiet cities.",
    avatarColor: "#800080",
    avatarUrl: null,
    snapshot: {
      wallpaper: "#800080",
      titleBarColor: "#800080",
      icons: [
        {
          id: "maya-profile",
          label: "Maya Chen's PC",
          type: "profile",
          x: 16,
          y: 16,
        },
        {
          id: "maya-documents",
          label: "Documents",
          type: "folder",
          x: 16,
          y: 96,
        },
        {
          id: "maya-drafts",
          label: "Drafts",
          type: "folder",
          x: 16,
          y: 176,
        },
        {
          id: "maya-file-welcome",
          label: "welcome",
          type: "text",
          x: 100,
          y: 16,
          documentId: "maya-doc-welcome",
          parentId: null,
        },
        {
          id: "maya-file-rain",
          label: "rain-notes",
          type: "text",
          x: 100,
          y: 96,
          documentId: "maya-doc-rain",
          parentId: null,
        },
        {
          id: "maya-file-poem",
          label: "window-seat",
          type: "text",
          x: 16,
          y: 16,
          documentId: "maya-doc-poem",
          parentId: "maya-drafts",
        },
      ],
      documents: [
        {
          id: "maya-doc-welcome",
          title: "welcome",
          slug: "welcome",
          content:
            "You found my machine.\n\nI keep drafts in the Drafts folder.\nLeave the wallpaper alone — purple is intentional.",
          createdAt: "2026-08-01T10:00:00.000Z",
          updatedAt: "2026-08-10T14:00:00.000Z",
        },
        {
          id: "maya-doc-rain",
          title: "rain-notes",
          slug: "rain-notes",
          content:
            "City rain on the fire escape.\nSomeone downstairs plays piano badly and I love it.\n\n— M",
          createdAt: "2026-08-05T18:30:00.000Z",
          updatedAt: "2026-08-05T18:30:00.000Z",
        },
        {
          id: "maya-doc-poem",
          title: "window-seat",
          slug: "window-seat",
          content:
            "The bus window holds the whole afternoon.\nSteam rises from cups I cannot smell.\nI am writing toward home.",
          createdAt: "2026-08-08T09:00:00.000Z",
          updatedAt: "2026-08-12T11:20:00.000Z",
        },
      ],
    },
  },
  {
    id: "rex",
    displayName: "Rex Ortega",
    computerName: "REX-BOX",
    bio: "Night writer. Horror-adjacent scraps about machines that remember people.\n\nBlack wallpaper. Green chrome. Favorites welcome if you survive the desktop.",
    avatarColor: "#008000",
    avatarUrl: null,
    snapshot: {
      wallpaper: "#000000",
      titleBarColor: "#008000",
      icons: [
        {
          id: "rex-profile",
          label: "Rex Ortega's PC",
          type: "profile",
          x: 16,
          y: 16,
        },
        {
          id: "rex-projects",
          label: "Projects",
          type: "folder",
          x: 16,
          y: 96,
        },
        {
          id: "rex-file-readme",
          label: "readme-first",
          type: "text",
          x: 100,
          y: 16,
          documentId: "rex-doc-readme",
          parentId: null,
        },
        {
          id: "rex-file-log",
          label: "night-log",
          type: "text",
          x: 100,
          y: 96,
          documentId: "rex-doc-log",
          parentId: null,
        },
        {
          id: "rex-file-outline",
          label: "chapter-zero",
          type: "text",
          x: 16,
          y: 16,
          documentId: "rex-doc-outline",
          parentId: "rex-projects",
        },
        {
          id: "rex-file-cast",
          label: "cast-list",
          type: "text",
          x: 16,
          y: 48,
          documentId: "rex-doc-cast",
          parentId: "rex-projects",
        },
      ],
      documents: [
        {
          id: "rex-doc-readme",
          title: "readme-first",
          slug: "readme-first",
          content:
            "REX-BOX // public desktop\n\nBlack wallpaper. Green chrome.\nOpen Projects for the WIP novel scraps.\nDo not rearrange my icons. I mean it.",
          createdAt: "2026-07-20T08:00:00.000Z",
          updatedAt: "2026-08-09T22:00:00.000Z",
        },
        {
          id: "rex-doc-log",
          title: "night-log",
          slug: "night-log",
          content:
            "02:14 — Wrote 400 words. Deleted 600.\n03:02 — Coffee was a mistake.\n04:10 — Kept the one paragraph that scared me.",
          createdAt: "2026-08-11T04:10:00.000Z",
          updatedAt: "2026-08-11T04:10:00.000Z",
        },
        {
          id: "rex-doc-outline",
          title: "chapter-zero",
          slug: "chapter-zero",
          content:
            "CHAPTER ZERO\n\nA stranger inherits a personal computer that still boots into someone else's life.\nThe files update overnight.\nNobody claims the machine.",
          createdAt: "2026-08-02T16:00:00.000Z",
          updatedAt: "2026-08-13T19:45:00.000Z",
        },
        {
          id: "rex-doc-cast",
          title: "cast-list",
          slug: "cast-list",
          content:
            "THE HOST — never appears on camera\nTHE INHERITOR — our POV\nTHE BOARD — anonymous posts that know too much",
          createdAt: "2026-08-03T12:00:00.000Z",
          updatedAt: "2026-08-03T12:00:00.000Z",
        },
      ],
    },
  },
];

/** Seed community notes (reach-outs). Story files live in Story Explorer. */
export const SEED_BBS_POSTS: BbsPost[] = [
  {
    id: "post-maya-1",
    authorId: "maya",
    title: "Anyone else writing on nights like this?",
    content:
      "Hello from MAYA-PC.\n\nIf you like quiet buses and loud cities, say hi on the board.\nI am around.",
    createdAt: "2026-08-12T15:00:00.000Z",
  },
  {
    id: "post-rex-1",
    authorId: "rex",
    title: "Looking for brave readers",
    content:
      "Working on something horror-adjacent about computers that remember people.\nIf that sounds like your thing, leave a note — or just browse Story Explorer.",
    createdAt: "2026-08-13T20:00:00.000Z",
  },
  {
    id: "post-maya-2",
    authorId: "maya",
    title: "Rain + bad piano",
    content:
      "Not a pitch — just checking who is online.\nHope your drafts are kinder than mine today.",
    createdAt: "2026-08-05T19:00:00.000Z",
  },
];

/** Public stories indexed for Story Explorer (independent of Favorites). */
export const PUBLIC_STORIES: PublicStory[] = [
  {
    id: "story-maya-poem",
    authorId: "maya",
    documentId: "maya-doc-poem",
    title: "window-seat",
    content:
      "The bus window holds the whole afternoon.\nSteam rises from cups I cannot smell.\nI am writing toward home.",
    publishedAt: "2026-08-12T11:20:00.000Z",
  },
  {
    id: "story-maya-rain",
    authorId: "maya",
    documentId: "maya-doc-rain",
    title: "rain-notes",
    content:
      "City rain on the fire escape.\nSomeone downstairs plays piano badly and I love it.\n\n— M",
    publishedAt: "2026-08-05T18:30:00.000Z",
  },
  {
    id: "story-rex-chapter",
    authorId: "rex",
    documentId: "rex-doc-outline",
    title: "chapter-zero",
    content:
      "CHAPTER ZERO\n\nA stranger inherits a personal computer that still boots into someone else's life.\nThe files update overnight.\nNobody claims the machine.",
    publishedAt: "2026-08-13T19:45:00.000Z",
  },
  {
    id: "story-rex-log",
    authorId: "rex",
    documentId: "rex-doc-log",
    title: "night-log",
    content:
      "02:14 — Wrote 400 words. Deleted 600.\n03:02 — Coffee was a mistake.\n04:10 — Kept the one paragraph that scared me.",
    publishedAt: "2026-08-11T04:10:00.000Z",
  },
];

export function getNetworkUser(userId: NetworkUserId): NetworkUser | undefined {
  return NETWORK_USERS.find((user) => user.id === userId);
}

export function authorDisplayName(authorId: NetworkUserId): string {
  if (authorId === LOCAL_USER_ID) {
    return "You";
  }
  return getNetworkUser(authorId)?.displayName ?? authorId;
}

export function getPublicStory(storyId: string): PublicStory | undefined {
  return PUBLIC_STORIES.find((story) => story.id === storyId);
}

export function listPublicStoriesNewestFirst(): PublicStory[] {
  return [...PUBLIC_STORIES].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function mergeBbsPostsNewestFirst(localPosts: BbsPost[]): BbsPost[] {
  return [...SEED_BBS_POSTS, ...localPosts].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/** @deprecated use mergeBbsPostsNewestFirst with local notes */
export function listBbsPostsNewestFirst(): BbsPost[] {
  return mergeBbsPostsNewestFirst([]);
}

export function remoteDesktopPath(user: NetworkUser): string {
  return `\\\\${user.computerName}\\Desktop`;
}
