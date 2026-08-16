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
  LOCAL_USER_ID,
  mergeBbsPostsNewestFirst,
} from "@/lib/networkSeed";
import { useDesktopStore } from "@/store/desktopStore";
import type { BbsPost } from "@/types/network";

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
    <MasterDetail
      header={
        <>
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
        </>
      }
      aboveSplit={
        composing ? (
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
        ) : null
      }
      list={
        posts.length === 0 ? (
          <p className="p-2 text-win-paper-muted">
            No notes yet. Post the first one.
          </p>
        ) : (
          <ul className="list-none">
            {posts.map((post) => {
              const active = post.id === effectiveSelectedId;
              return (
                <MasterDetailListItem
                  key={post.id}
                  active={active}
                  onSelect={() => setSelectedId(post.id)}
                  title={
                    <>
                      <TextFileIcon size={14} className="shrink-0" />
                      <span className="min-w-0 flex-1 truncate pl-0.5">
                        {post.title}
                      </span>
                    </>
                  }
                  meta={
                    <>
                      {authorDisplayName(post.authorId)} ·{" "}
                      {formatShortDateTime(post.createdAt)}
                    </>
                  }
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
          emptyMessage="Select a note to read."
          action={
            canVisit && selected ? (
              <VisitPcButton
                userId={selected.authorId}
                className="ml-auto"
              />
            ) : null
          }
        />
      }
    />
  );
}
