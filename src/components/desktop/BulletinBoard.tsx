"use client";

import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/desktop/ConfirmDialog";
import { BbsPinIcon, DeleteIcon, PlusIcon } from "@/components/desktop/icons";
import {
  MasterDetail,
  MasterDetailListItem,
  MasterDetailPane,
} from "@/components/desktop/MasterDetail";
import { VisitPcButton } from "@/components/desktop/VisitPcButton";
import { formatShortDateTime } from "@/lib/formatDate";
import {
  canPostBbsNoteToday,
  clampBbsNoteContent,
  clampBbsNoteTitle,
  countBbsNotesOnUtcDay,
  MAX_BBS_NOTE_CHARS,
  MAX_BBS_NOTE_TITLE_CHARS,
  MAX_BBS_NOTES_PER_UTC_DAY,
} from "@/lib/bbsNotes";
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
  const deleteBbsNote = useDesktopStore((state) => state.deleteBbsNote);
  const posts = useMemo(
    () => mergeBbsPostsNewestFirst(localBbsNotes),
    [localBbsNotes],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [showDailyLimit, setShowDailyLimit] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const postsToday = countBbsNotesOnUtcDay(localBbsNotes);
  const atDailyLimit = !canPostBbsNoteToday(localBbsNotes);

  const effectiveSelectedId = selectedId ?? posts[0]?.id ?? null;
  const selected: BbsPost | undefined = posts.find(
    (post) => post.id === effectiveSelectedId,
  );
  const isOwnPost =
    selected != null && selected.authorId === LOCAL_USER_ID;
  const canVisit =
    selected != null &&
    selected.authorId !== LOCAL_USER_ID &&
    Boolean(getNetworkUser(selected.authorId));

  const charCount = draftBody.length;
  const atCharLimit = charCount >= MAX_BBS_NOTE_CHARS;

  const onNewPostClick = () => {
    if (composing) {
      setComposing(false);
      return;
    }
    if (atDailyLimit) {
      setShowDailyLimit(true);
      return;
    }
    setComposing(true);
  };

  const onPost = () => {
    const title = draftTitle.trim();
    const content = draftBody.trim();
    if (!title || !content) {
      return;
    }
    if (!canPostBbsNoteToday(useDesktopStore.getState().localBbsNotes)) {
      setShowDailyLimit(true);
      setComposing(false);
      return;
    }
    const id = postBbsNote(title, content);
    if (!id) {
      setShowDailyLimit(true);
      setComposing(false);
      return;
    }
    setDraftTitle("");
    setDraftBody("");
    setComposing(false);
    setSelectedId(id);
  };

  const dismissDailyLimit = () => setShowDailyLimit(false);

  const requestDelete = () => {
    if (!selected || selected.authorId !== LOCAL_USER_ID) {
      return;
    }
    setPendingDeleteId(selected.id);
  };

  const cancelDelete = () => setPendingDeleteId(null);

  const confirmDelete = () => {
    if (!pendingDeleteId) {
      return;
    }
    const deletedId = pendingDeleteId;
    const ok = deleteBbsNote(deletedId);
    setPendingDeleteId(null);
    if (!ok) {
      return;
    }
    const remaining = mergeBbsPostsNewestFirst(
      useDesktopStore.getState().localBbsNotes,
    );
    setSelectedId(remaining[0]?.id ?? null);
  };

  const detailAction = (() => {
    if (canVisit && selected) {
      return <VisitPcButton userId={selected.authorId} />;
    }
    if (isOwnPost) {
      return (
        <button
          type="button"
          className="win-raised flex items-center gap-1 px-2 py-0.5"
          onClick={requestDelete}
        >
          <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
            <DeleteIcon size={14} />
          </span>
          Delete
        </button>
      );
    }
    return null;
  })();

  return (
    <div className="relative h-full min-h-0">
      <MasterDetail
        header={
          <>
            <span className="min-w-0 flex-1 text-win-dark">
              Bulletin Board — leave a post for the community
            </span>
            <button
              type="button"
              className="win-raised flex items-center gap-1 px-2 py-0.5"
              onClick={onNewPostClick}
            >
              {composing ? (
                "Cancel"
              ) : (
                <>
                  <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                    <PlusIcon size={14} />
                  </span>
                  New Post
                </>
              )}
            </button>
          </>
        }
        aboveSplit={
          composing ? (
            <div className="flex flex-col border-b border-win-dark">
              <div className="flex flex-col gap-2 p-2">
                <label className="flex items-center gap-2">
                  <span className="w-12 shrink-0">Title</span>
                  <input
                    className="win-sunken min-w-0 flex-1 bg-win-paper px-1 py-0.5 text-win-ink outline-none"
                    value={draftTitle}
                    onChange={(event) =>
                      setDraftTitle(clampBbsNoteTitle(event.target.value))
                    }
                    maxLength={MAX_BBS_NOTE_TITLE_CHARS}
                    spellCheck={false}
                  />
                </label>
                <textarea
                  className="win-sunken min-h-[88px] resize-none bg-win-paper p-2 text-win-ink outline-none"
                  value={draftBody}
                  onChange={(event) =>
                    setDraftBody(clampBbsNoteContent(event.target.value))
                  }
                  placeholder="Say hello, ask for readers, share what you're working on…"
                  spellCheck={false}
                  aria-label="Post content"
                  maxLength={MAX_BBS_NOTE_CHARS}
                />
              </div>
              <div className="relative z-10 flex shrink-0 items-center justify-between gap-2 border-t border-win-dark px-2 py-0.5">
                <span
                  className="text-[11px] text-win-dark"
                  aria-live="polite"
                >
                  <span aria-label="Character count">
                    {charCount}/{MAX_BBS_NOTE_CHARS}
                    {atCharLimit ? " (limit reached)" : ""}
                  </span>
                  <span aria-hidden="true"> · </span>
                  <span aria-label="Daily post count">
                    {postsToday}/{MAX_BBS_NOTES_PER_UTC_DAY} today
                  </span>
                </span>
                <button
                  type="button"
                  className="win-raised px-3 py-0.5 disabled:opacity-50"
                  disabled={!draftTitle.trim() || !draftBody.trim()}
                  onMouseDown={(event) => event.stopPropagation()}
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
              No posts yet. Be the first.
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
                        <BbsPinIcon size={14} className="shrink-0" />
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
            emptyMessage="Select a post to read."
            action={detailAction}
          />
        }
      />
      {showDailyLimit ? (
        <ConfirmDialog
          title="Bulletin Board"
          message={`You have reached the daily limit of ${MAX_BBS_NOTES_PER_UTC_DAY} posts (${postsToday}/${MAX_BBS_NOTES_PER_UTC_DAY}).\n\nThe limit resets at midnight UTC.`}
          confirmLabel="OK"
          showCancel={false}
          onConfirm={dismissDailyLimit}
          onCancel={dismissDailyLimit}
        />
      ) : null}
      {pendingDeleteId ? (
        <ConfirmDialog
          title="Bulletin Board"
          message="Delete this post? Your daily post limit is not refunded."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      ) : null}
    </div>
  );
}
