"use client";

import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/desktop/ConfirmDialog";
import { DeleteIcon } from "@/components/desktop/icons";
import { formatShortDateTime } from "@/lib/formatDate";
import {
  authorDisplayName,
  LOCAL_USER_ID,
  mergeStoryCommentsOldestFirst,
} from "@/lib/networkSeed";
import {
  canPostStoryCommentToday,
  clampStoryCommentContent,
  countStoryCommentsOnUtcDay,
  MAX_STORY_COMMENT_CHARS,
  MAX_STORY_COMMENTS_PER_UTC_DAY,
} from "@/lib/storyComments";
import { useDesktopStore } from "@/store/desktopStore";

interface CommentsWindowProps {
  documentId: string | null;
}

export function CommentsWindow({ documentId }: CommentsWindowProps) {
  const localStoryComments = useDesktopStore(
    (state) => state.localStoryComments,
  );
  const postStoryComment = useDesktopStore((state) => state.postStoryComment);
  const deleteStoryComment = useDesktopStore(
    (state) => state.deleteStoryComment,
  );

  const comments = useMemo(
    () =>
      documentId
        ? mergeStoryCommentsOldestFirst(documentId, localStoryComments)
        : [],
    [documentId, localStoryComments],
  );

  const [draft, setDraft] = useState("");
  const [showDailyLimit, setShowDailyLimit] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const commentsToday = countStoryCommentsOnUtcDay(localStoryComments);
  const atDailyLimit = !canPostStoryCommentToday(localStoryComments);
  const charCount = draft.length;
  const atCharLimit = charCount >= MAX_STORY_COMMENT_CHARS;

  const onPost = () => {
    if (!documentId) {
      return;
    }
    const content = draft.trim();
    if (!content) {
      return;
    }
    if (
      !canPostStoryCommentToday(useDesktopStore.getState().localStoryComments)
    ) {
      setShowDailyLimit(true);
      return;
    }
    const id = postStoryComment(documentId, content);
    if (!id) {
      setShowDailyLimit(true);
      return;
    }
    setDraft("");
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) {
      return;
    }
    deleteStoryComment(pendingDeleteId);
    setPendingDeleteId(null);
  };

  if (!documentId) {
    return (
      <div className="flex h-full items-center justify-center bg-win-face p-3 text-[12px] text-win-dark">
        No story selected.
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-win-face text-[12px]">
      <div className="shrink-0 border-b border-win-dark px-2 py-1 text-win-dark">
        Chronological — oldest first
      </div>
      <div className="win-sunken m-1 min-h-0 flex-1 overflow-auto bg-win-paper text-win-ink">
        {comments.length === 0 ? (
          <p className="p-2 text-win-paper-muted">
            No comments yet. Be the first.
          </p>
        ) : (
          <ul className="list-none">
            {comments.map((comment) => {
              const isOwn = comment.authorId === LOCAL_USER_ID;
              return (
                <li
                  key={comment.id}
                  className="border-b border-win-dark px-2 py-1.5 last:border-b-0"
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="font-bold">
                          {authorDisplayName(comment.authorId)}
                        </span>
                        <span className="text-[11px] text-win-paper-muted">
                          {formatShortDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap leading-5">
                        {comment.content}
                      </p>
                    </div>
                    {isOwn ? (
                      <button
                        type="button"
                        className="win-raised flex shrink-0 items-center gap-1 px-1.5 py-0.5"
                        onClick={() => setPendingDeleteId(comment.id)}
                        aria-label="Delete comment"
                      >
                        <span className="inline-flex h-3.5 w-3.5 items-center justify-center">
                          <DeleteIcon size={14} />
                        </span>
                        Delete
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="shrink-0 border-t border-win-dark">
        <textarea
          className="win-sunken m-1 mb-0 min-h-[72px] w-[calc(100%-8px)] resize-none bg-win-paper p-2 text-win-ink outline-none"
          value={draft}
          onChange={(event) =>
            setDraft(clampStoryCommentContent(event.target.value))
          }
          placeholder="Leave a short comment…"
          spellCheck={false}
          aria-label="Comment content"
          maxLength={MAX_STORY_COMMENT_CHARS}
        />
        <div className="flex items-center justify-between gap-2 px-2 py-0.5">
          <span className="text-[11px] text-win-dark" aria-live="polite">
            <span aria-label="Character count">
              {charCount}/{MAX_STORY_COMMENT_CHARS}
              {atCharLimit ? " (limit reached)" : ""}
            </span>
            <span aria-hidden="true"> · </span>
            <span aria-label="Daily comment count">
              {commentsToday}/{MAX_STORY_COMMENTS_PER_UTC_DAY} today
            </span>
          </span>
          <button
            type="button"
            className="win-raised px-3 py-0.5 disabled:opacity-50"
            disabled={!draft.trim() || atDailyLimit}
            onClick={onPost}
          >
            Post
          </button>
        </div>
      </div>
      {showDailyLimit ? (
        <ConfirmDialog
          title="Comments"
          message={`You have reached the daily limit of ${MAX_STORY_COMMENTS_PER_UTC_DAY} comments (${commentsToday}/${MAX_STORY_COMMENTS_PER_UTC_DAY}).\n\nThe limit resets at midnight UTC.`}
          confirmLabel="OK"
          showCancel={false}
          onConfirm={() => setShowDailyLimit(false)}
          onCancel={() => setShowDailyLimit(false)}
        />
      ) : null}
      {pendingDeleteId ? (
        <ConfirmDialog
          title="Comments"
          message="Delete this comment?"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      ) : null}
    </div>
  );
}
