"use client";

import { useEffect, useMemo, useState } from "react";
import { CommentsIcon, TextFileIcon } from "@/components/desktop/icons";
import {
  MasterDetail,
  MasterDetailListItem,
  MasterDetailPane,
} from "@/components/desktop/MasterDetail";
import { VisitPcButton } from "@/components/desktop/VisitPcButton";
import { usePcRoutes } from "@/hooks/usePcRoutes";
import { formatShortDateTime } from "@/lib/formatDate";
import {
  authorDisplayName,
  getNetworkUser,
  listPublicStoriesNewestFirst,
  LOCAL_USER_ID,
} from "@/lib/networkSeed";
import { sessionUsername } from "@/lib/localSession";
import { pullRemotePublicStories } from "@/lib/remoteSocialPersist";
import { findDocumentSlugForUser } from "@/lib/seo/publicContent";
import { useDesktopStore } from "@/store/desktopStore";
import type { PublicStory } from "@/types/network";

function snippet(content: string, max = 80): string {
  const flat = content.replace(/\s+/g, " ").trim();
  if (flat.length <= max) {
    return flat;
  }
  return `${flat.slice(0, max - 1)}…`;
}

function mergePublicStories(
  remote: PublicStory[],
  seeds: PublicStory[],
): PublicStory[] {
  const byId = new Map<string, PublicStory>();
  for (const story of seeds) {
    byId.set(story.id, story);
  }
  for (const story of remote) {
    byId.set(story.id, story);
  }
  return [...byId.values()].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function StoryExplorer() {
  const seedStories = useMemo(() => listPublicStoriesNewestFirst(), []);
  const documents = useDesktopStore((state) => state.documents);
  const ownUsername = sessionUsername();
  const localPublicStories = useMemo((): PublicStory[] => {
    if (!ownUsername) {
      return [];
    }
    return documents
      .filter((doc) => doc.isPublic === true)
      .map((doc) => ({
        id: doc.id,
        authorId: ownUsername,
        documentId: doc.id,
        title: doc.title,
        content: doc.content,
        publishedAt: doc.updatedAt,
        slug: doc.slug,
      }));
  }, [documents, ownUsername]);
  const [remoteStories, setRemoteStories] = useState<PublicStory[]>([]);
  const stories = useMemo(
    () =>
      mergePublicStories(
        remoteStories,
        mergePublicStories(localPublicStories, seedStories),
      ),
    [remoteStories, localPublicStories, seedStories],
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    seedStories[0]?.id ?? null,
  );
  const { openPublicFile } = usePcRoutes();
  const openStoryComments = useDesktopStore(
    (state) => state.openStoryComments,
  );

  useEffect(() => {
    let cancelled = false;
    void pullRemotePublicStories().then((remote) => {
      if (cancelled || remote.length === 0) {
        return;
      }
      setRemoteStories(remote);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedId && stories.some((story) => story.id === selectedId)) {
      return;
    }
    setSelectedId(stories[0]?.id ?? null);
  }, [stories, selectedId]);

  const selected: PublicStory | undefined = stories.find(
    (story) => story.id === selectedId,
  );
  const author =
    selected && selected.authorId !== LOCAL_USER_ID
      ? getNetworkUser(selected.authorId)
      : undefined;
  const fileSlug =
    selected?.slug ??
    (selected && author
      ? findDocumentSlugForUser(author.id, selected.documentId)
      : undefined);
  const visitUserId =
    selected && selected.authorId !== LOCAL_USER_ID
      ? selected.authorId
      : undefined;

  return (
    <MasterDetail
      header={
        <span className="min-w-0 flex-1 text-win-dark">
          Story Explorer — public writing from the network (Publish in Notepad)
        </span>
      }
      list={
        stories.length === 0 ? (
          <p className="p-2 text-win-paper-muted">No public stories yet.</p>
        ) : (
          <ul className="list-none">
            {stories.map((story) => {
              const active = story.id === selectedId;
              return (
                <MasterDetailListItem
                  key={story.id}
                  active={active}
                  onSelect={() => setSelectedId(story.id)}
                  title={
                    <>
                      <TextFileIcon size={14} className="shrink-0" />
                      <span className="min-w-0 flex-1 truncate pl-0.5">
                        {story.title}
                      </span>
                    </>
                  }
                  meta={
                    <>
                      {authorDisplayName(story.authorId)} ·{" "}
                      {formatShortDateTime(story.publishedAt)}
                    </>
                  }
                  subtitle={snippet(story.content)}
                />
              );
            })}
          </ul>
        )
      }
      detail={
        <MasterDetailPane
          item={
            selected
              ? {
                  title: selected.title,
                  authorLabel: `by ${authorDisplayName(selected.authorId)}`,
                  content: selected.content,
                }
              : null
          }
          emptyMessage="Select a story to read."
          showHeading={false}
          action={
            selected ? (
              <>
                {visitUserId && fileSlug ? (
                  <button
                    type="button"
                    className="win-raised flex items-center gap-1 px-2 py-0.5"
                    onClick={() => openPublicFile(visitUserId, fileSlug)}
                  >
                    <TextFileIcon size={14} />
                    Open file
                  </button>
                ) : null}
                <button
                  type="button"
                  className="win-raised flex items-center gap-1 px-2 py-0.5"
                  onClick={() =>
                    openStoryComments({
                      documentId: selected.documentId,
                      storyTitle: selected.title,
                    })
                  }
                >
                  <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                    <CommentsIcon size={14} />
                  </span>
                  Comments
                </button>
                {visitUserId ? <VisitPcButton userId={visitUserId} /> : null}
              </>
            ) : null
          }
        />
      }
    />
  );
}
