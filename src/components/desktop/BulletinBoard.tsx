"use client";

import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/desktop/ConfirmDialog";
import { BbsPinIcon, DeleteIcon, PlusIcon } from "@/components/desktop/icons";
import { VisitPcButton } from "@/components/desktop/VisitPcButton";
import { formatShortDateTime } from "@/lib/formatDate";
import {
  bbsPostNeedsCollapse,
  canPostBbsNoteToday,
  clampBbsNoteContent,
  clampBbsNoteTitle,
  collapseBbsPostContent,
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

export function BulletinBoard() {
  const localBbsNotes = useDesktopStore((state) => state.localBbsNotes);
  const postBbsNote = useDesktopStore((state) => state.postBbsNote);
  const deleteBbsNote = useDesktopStore((state) => state.deleteBbsNote);
  const posts = useMemo(
    () => mergeBbsPostsNewestFirst(localBbsNotes),
    [localBbsNotes],
  );
  const [composing, setComposing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [showDailyLimit, setShowDailyLimit] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [expandedPostIds, setExpandedPostIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const postsToday = countBbsNotesOnUtcDay(localBbsNotes);
  const atDailyLimit = !canPostBbsNoteToday(localBbsNotes);
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
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) {
      return;
    }
    deleteBbsNote(pendingDeleteId);
    setPendingDeleteId(null);
  };

  const toggleExpanded = (postId: string) => {
    setExpandedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-win-face text-[12px]">
      <div className="flex shrink-0 items-center gap-2 border-b border-win-dark px-2 py-1 text-win-dark">
        <span className="min-w-0 flex-1">
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
      </div>

      {composing ? (
        <div className="shrink-0 border-b border-win-dark bg-win-face">
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
                aria-label="Title"
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
          <div className="flex items-center justify-between gap-2 border-t border-win-dark px-2 py-0.5">
            <span className="text-[11px] text-win-dark" aria-live="polite">
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
              onClick={onPost}
            >
              Post
            </button>
          </div>
        </div>
      ) : null}

      <div className="win-sunken m-1 min-h-0 flex-1 overflow-auto bg-win-paper text-win-ink">
        {posts.length === 0 ? (
          <p className="p-2 text-win-paper-muted">
            No posts yet. Be the first.
          </p>
        ) : (
          <ul className="list-none">
            {posts.map((post) => {
              const isOwn = post.authorId === LOCAL_USER_ID;
              const canVisit =
                !isOwn && Boolean(getNetworkUser(post.authorId));
              const needsCollapse = bbsPostNeedsCollapse(post.content);
              const expanded = expandedPostIds.has(post.id);
              const bodyText =
                needsCollapse && !expanded
                  ? collapseBbsPostContent(post.content)
                  : post.content;
              return (
                <li
                  key={post.id}
                  className="border-b border-win-dark px-2 py-3 last:border-b-0"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0" aria-hidden="true">
                      <BbsPinIcon size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold leading-4">{post.title}</h3>
                      <p className="mt-0.5 text-[11px] leading-4 text-win-paper-muted">
                        {authorDisplayName(post.authorId)} ·{" "}
                        {formatShortDateTime(post.createdAt)}
                      </p>
                      <p className="mt-3.5 pl-4 whitespace-pre-wrap leading-6">
                        {bodyText}
                        {needsCollapse && !expanded ? "…" : ""}
                      </p>
                      {needsCollapse ? (
                        <button
                          type="button"
                          className="win-raised mt-1.5 ml-4 px-1.5 py-0.5 text-[11px]"
                          onClick={() => toggleExpanded(post.id)}
                        >
                          {expanded ? "Show less" : "Read more"}
                        </button>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      {canVisit ? (
                        <VisitPcButton userId={post.authorId} />
                      ) : null}
                      {isOwn ? (
                        <button
                          type="button"
                          className="win-raised flex items-center gap-1 px-1.5 py-0.5"
                          onClick={() => setPendingDeleteId(post.id)}
                          aria-label={`Delete ${post.title}`}
                        >
                          <span className="inline-flex h-3.5 w-3.5 items-center justify-center">
                            <DeleteIcon size={14} />
                          </span>
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showDailyLimit ? (
        <ConfirmDialog
          title="Bulletin Board"
          message={`You have reached the daily limit of ${MAX_BBS_NOTES_PER_UTC_DAY} posts (${postsToday}/${MAX_BBS_NOTES_PER_UTC_DAY}).\n\nThe limit resets at midnight UTC.`}
          confirmLabel="OK"
          showCancel={false}
          onConfirm={() => setShowDailyLimit(false)}
          onCancel={() => setShowDailyLimit(false)}
        />
      ) : null}
      {pendingDeleteId ? (
        <ConfirmDialog
          title="Bulletin Board"
          message="Delete this post? Your daily post limit is not refunded."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      ) : null}
    </div>
  );
}
