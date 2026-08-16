"use client";

import { useMemo, useState } from "react";
import { TextFileIcon } from "@/components/desktop/icons";
import { VisitPcButton } from "@/components/desktop/VisitPcButton";
import {
  authorDisplayName,
  getNetworkUser,
  LOCAL_USER_ID,
  mergeBbsPostsNewestFirst,
} from "@/lib/networkSeed";
import { useDesktopStore } from "@/store/desktopStore";
import type { BbsPost } from "@/types/network";

function formatPostDate(iso: string): string {
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

export function BulletinBoard() {
  const localBbsNotes = useDesktopStore((state) => state.localBbsNotes);
  const postBbsNote = useDesktopStore((state) => state.postBbsNote);
  const posts = useMemo(
    () => mergeBbsPostsNewestFirst(localBbsNotes),
    [localBbsNotes],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");

  const effectiveSelectedId = selectedId ?? posts[0]?.id ?? null;
  const selected: BbsPost | undefined = posts.find(
    (post) => post.id === effectiveSelectedId,
  );
  const canVisit =
    selected != null &&
    selected.authorId !== LOCAL_USER_ID &&
    Boolean(getNetworkUser(selected.authorId));

  const onPost = () => {
    const title = draftTitle.trim();
    const content = draftBody.trim();
    if (!title || !content) {
      return;
    }
    const id = postBbsNote(title, content);
    setDraftTitle("");
    setDraftBody("");
    setComposing(false);
    setSelectedId(id);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-win-face text-[12px]">
      <div className="flex items-center gap-2 border-b border-win-dark px-2 py-1">
        <span className="min-w-0 flex-1 text-win-dark">
          Bulletin Board — leave a note for the community
        </span>
        <button
          type="button"
          className="win-raised px-2 py-0.5"
          onClick={() => setComposing((value) => !value)}
        >
          {composing ? "Cancel" : "New Note"}
        </button>
      </div>

      {composing ? (
        <div className="flex flex-col gap-2 border-b border-win-dark p-2">
          <label className="flex items-center gap-2">
            <span className="w-12 shrink-0">Title</span>
            <input
              className="win-sunken min-w-0 flex-1 bg-win-paper px-1 py-0.5 text-win-ink outline-none"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              maxLength={80}
              spellCheck={false}
            />
          </label>
          <textarea
            className="win-sunken min-h-[88px] resize-none bg-win-paper p-2 text-win-ink outline-none"
            value={draftBody}
            onChange={(event) => setDraftBody(event.target.value)}
            placeholder="Say hello, ask for readers, share what you're working on…"
            spellCheck={false}
          />
          <div className="flex justify-end">
            <button
              type="button"
              className="win-raised px-3 py-0.5 disabled:opacity-50"
              disabled={!draftTitle.trim() || !draftBody.trim()}
              onClick={onPost}
            >
              Post
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <div className="win-sunken m-1 w-[42%] overflow-auto bg-win-paper text-win-ink">
          {posts.length === 0 ? (
            <p className="p-2 text-win-paper-muted">No notes yet. Post the first one.</p>
          ) : (
            <ul className="list-none">
              {posts.map((post) => {
                const active = post.id === effectiveSelectedId;
                return (
                  <li key={post.id}>
                    <button
                      type="button"
                      className={`flex w-full flex-col gap-0.5 px-2 py-1.5 text-left ${
                        active
                          ? "bg-win-navy text-white"
                          : "hover:bg-win-paper-hover"
                      }`}
                      onClick={() => setSelectedId(post.id)}
                    >
                      <span className="flex items-center gap-2 font-bold">
                        <TextFileIcon size={14} className="shrink-0" />
                        <span className="min-w-0 flex-1 truncate pl-0.5">
                          {post.title}
                        </span>
                      </span>
                      <span
                        className={`truncate text-[11px] ${
                          active ? "text-white/90" : "text-win-paper-muted"
                        }`}
                      >
                        {authorDisplayName(post.authorId)} ·{" "}
                        {formatPostDate(post.createdAt)}
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
                {canVisit ? (
                  <VisitPcButton
                    userId={selected.authorId}
                    className="ml-auto"
                  />
                ) : null}
              </div>
              <div className="win-sunken min-h-0 flex-1 overflow-auto whitespace-pre-wrap bg-win-paper p-2 leading-5 text-win-ink">
                {selected.content}
              </div>
            </>
          ) : (
            <div className="win-sunken flex flex-1 items-center justify-center bg-win-paper text-win-paper-muted">
              Select a note to read.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
