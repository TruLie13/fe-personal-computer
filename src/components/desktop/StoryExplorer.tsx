"use client";

import { useMemo, useState } from "react";
import { TextFileIcon } from "@/components/desktop/icons";
import {
  MasterDetail,
  MasterDetailListItem,
  MasterDetailPane,
} from "@/components/desktop/MasterDetail";
import { VisitPcButton } from "@/components/desktop/VisitPcButton";
import { formatShortDateTime } from "@/lib/formatDate";
import {
  authorDisplayName,
  getNetworkUser,
  listPublicStoriesNewestFirst,
  LOCAL_USER_ID,
} from "@/lib/networkSeed";
import type { PublicStory } from "@/types/network";

function snippet(content: string, max = 80): string {
  const flat = content.replace(/\s+/g, " ").trim();
  if (flat.length <= max) {
    return flat;
  }
  return `${flat.slice(0, max - 1)}…`;
}

export function StoryExplorer() {
  const stories = useMemo(() => listPublicStoriesNewestFirst(), []);
  const [selectedId, setSelectedId] = useState<string | null>(
    stories[0]?.id ?? null,
  );

  const selected: PublicStory | undefined = stories.find(
    (story) => story.id === selectedId,
  );
  const author =
    selected && selected.authorId !== LOCAL_USER_ID
      ? getNetworkUser(selected.authorId)
      : undefined;

  return (
    <MasterDetail
      header={
        <span className="min-w-0 flex-1 text-win-dark">
          Story Explorer — public writing from the network (no follow required)
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
          action={
            author ? (
              <VisitPcButton userId={author.id} className="ml-auto" />
            ) : null
          }
        />
      }
    />
  );
}
