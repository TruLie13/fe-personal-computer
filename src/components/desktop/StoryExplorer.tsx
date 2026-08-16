"use client";

import { useMemo, useState } from "react";
import { ComputerIcon, TextFileIcon } from "@/components/desktop/icons";
import {
  authorDisplayName,
  getNetworkUser,
  listPublicStoriesNewestFirst,
  LOCAL_USER_ID,
} from "@/lib/networkSeed";
import { useDesktopStore } from "@/store/desktopStore";
import type { PublicStory } from "@/types/network";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function snippet(content: string, max = 80): string {
  const flat = content.replace(/\s+/g, " ").trim();
  if (flat.length <= max) {
    return flat;
  }
  return `${flat.slice(0, max - 1)}…`;
}

export function StoryExplorer() {
  const visitRemotePc = useDesktopStore((state) => state.visitRemotePc);
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
    <div className="flex h-full min-h-0 flex-col bg-win-face text-[12px]">
      <div className="border-b border-win-dark px-2 py-1 text-win-dark">
        Story Explorer — public writing from the network (no follow required)
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="win-sunken m-1 w-[42%] overflow-auto bg-win-paper text-win-ink">
          {stories.length === 0 ? (
            <p className="p-2 text-win-paper-muted">No public stories yet.</p>
          ) : (
            <ul>
              {stories.map((story) => {
                const active = story.id === selectedId;
                return (
                  <li key={story.id}>
                    <button
                      type="button"
                      className={`flex w-full flex-col gap-0.5 px-2 py-1.5 text-left ${
                        active
                          ? "bg-win-navy text-white"
                          : "hover:bg-win-paper-hover"
                      }`}
                      onClick={() => setSelectedId(story.id)}
                    >
                      <span className="flex items-center gap-1 font-bold">
                        <TextFileIcon size={14} />
                        <span className="truncate">{story.title}</span>
                      </span>
                      <span
                        className={`truncate text-[11px] ${
                          active ? "text-white/90" : "text-win-paper-muted"
                        }`}
                      >
                        {authorDisplayName(story.authorId)} ·{" "}
                        {formatDate(story.publishedAt)}
                      </span>
                      <span
                        className={`line-clamp-2 text-[11px] ${
                          active ? "text-white/80" : "text-win-paper-muted"
                        }`}
                      >
                        {snippet(story.content)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="m-1 flex min-w-0 flex-1 flex-col">
          {selected ? (
            <>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="font-bold">{selected.title}</span>
                <span className="text-win-dark">
                  by {authorDisplayName(selected.authorId)}
                </span>
                {author ? (
                  <button
                    type="button"
                    className="win-raised ml-auto flex items-center gap-1 px-2 py-0.5"
                    onClick={() => visitRemotePc(author.id)}
                  >
                    <ComputerIcon size={14} />
                    Visit PC
                  </button>
                ) : null}
              </div>
              <div className="win-sunken min-h-0 flex-1 overflow-auto whitespace-pre-wrap bg-win-paper p-2 leading-5 text-win-ink">
                {selected.content}
              </div>
            </>
          ) : (
            <div className="win-sunken flex flex-1 items-center justify-center bg-win-paper text-win-paper-muted">
              Select a story to read.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
