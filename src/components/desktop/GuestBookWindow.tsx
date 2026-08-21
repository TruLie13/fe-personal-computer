"use client";

import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/desktop/ConfirmDialog";
import { DeleteIcon } from "@/components/desktop/icons";
import { VisitPcButton } from "@/components/desktop/VisitPcButton";
import { formatShortDateTime } from "@/lib/formatDate";
import {
  canSignGuestbookToday,
  clampGuestbookEntryContent,
  countGuestbookSignsOnHostUtcDay,
  MAX_GUESTBOOK_ENTRY_CHARS,
  MAX_GUESTBOOK_SIGNS_PER_HOST_PER_UTC_DAY,
} from "@/lib/guestbook";
import {
  authorDisplayName,
  getNetworkUser,
  LOCAL_USER_ID,
  mergeGuestbookOldestFirst,
} from "@/lib/networkSeed";
import { useDesktopStore } from "@/store/desktopStore";

function canDeleteEntry(
  entry: { authorId: string; hostUserId: string },
  isOwnBook: boolean,
): boolean {
  return (
    entry.authorId === LOCAL_USER_ID ||
    (isOwnBook && entry.hostUserId === LOCAL_USER_ID)
  );
}

export function GuestBookWindow() {
  const viewMode = useDesktopStore((state) => state.viewMode);
  const remoteUserId = useDesktopStore((state) => state.remoteUserId);
  const localGuestbookEntries = useDesktopStore(
    (state) => state.localGuestbookEntries,
  );
  const signGuestbook = useDesktopStore((state) => state.signGuestbook);
  const deleteGuestbookEntry = useDesktopStore(
    (state) => state.deleteGuestbookEntry,
  );

  const hostUserId =
    viewMode === "remote" && remoteUserId ? remoteUserId : LOCAL_USER_ID;
  const canSign = viewMode === "remote" && hostUserId !== LOCAL_USER_ID;
  const isOwnBook = hostUserId === LOCAL_USER_ID;

  const entries = useMemo(
    () => mergeGuestbookOldestFirst(hostUserId, localGuestbookEntries),
    [hostUserId, localGuestbookEntries],
  );

  const [draft, setDraft] = useState("");
  const [showDailyLimit, setShowDailyLimit] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const signsToday = countGuestbookSignsOnHostUtcDay(
    localGuestbookEntries,
    hostUserId,
    LOCAL_USER_ID,
  );
  const atDailyLimit = !canSignGuestbookToday(
    localGuestbookEntries,
    hostUserId,
    LOCAL_USER_ID,
  );
  const charCount = draft.length;
  const atCharLimit = charCount >= MAX_GUESTBOOK_ENTRY_CHARS;

  const hostLabel =
    hostUserId === LOCAL_USER_ID
      ? "this PC"
      : (getNetworkUser(hostUserId)?.displayName ?? hostUserId);

  const onSign = () => {
    const content = draft.trim();
    if (!content || !canSign) {
      return;
    }
    if (
      !canSignGuestbookToday(
        useDesktopStore.getState().localGuestbookEntries,
        hostUserId,
        LOCAL_USER_ID,
      )
    ) {
      setShowDailyLimit(true);
      return;
    }
    const id = signGuestbook(hostUserId, content);
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
    deleteGuestbookEntry(pendingDeleteId);
    setPendingDeleteId(null);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-win-face text-[12px]">
      <div className="flex shrink-0 items-center gap-2 border-b border-win-dark px-2 py-1 text-win-dark">
        <span className="min-w-0 flex-1">
          Guest Book — signed pages for {hostLabel}
        </span>
        <span className="shrink-0 text-[11px] text-win-dark/80">
          oldest first
        </span>
      </div>

      <div className="win-guestbook-wall win-sunken m-1 min-h-0 flex-1 overflow-auto bg-win-paper text-win-ink">
        {entries.length === 0 ? (
          <p className="p-3 text-win-paper-muted">
            {canSign
              ? "This book is empty. Leave the first signature below."
              : "No signatures yet. Visitors leave messages when they Visit PC."}
          </p>
        ) : (
          <ul className="list-none p-2">
            {entries.map((entry) => {
              const canVisit =
                entry.authorId !== LOCAL_USER_ID &&
                Boolean(getNetworkUser(entry.authorId));
              const canDelete = canDeleteEntry(entry, isOwnBook);
              return (
                <li
                  key={entry.id}
                  className="mb-2 border border-win-dark bg-win-paper-hover px-2 py-1.5 last:mb-0"
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="font-bold">
                          {authorDisplayName(entry.authorId)}
                        </span>
                        <span className="text-[11px] text-win-paper-muted">
                          {formatShortDateTime(entry.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap leading-5">
                        {entry.content}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      {canVisit ? (
                        <VisitPcButton userId={entry.authorId} />
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          className="win-raised flex items-center gap-1 px-1.5 py-0.5"
                          onClick={() => setPendingDeleteId(entry.id)}
                          aria-label="Delete signature"
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

      {canSign ? (
        <div className="shrink-0 border-t border-win-dark">
          <textarea
            className="win-sunken m-1 mb-0 min-h-[72px] w-[calc(100%-8px)] resize-none bg-win-paper p-2 text-win-ink outline-none"
            value={draft}
            onChange={(event) =>
              setDraft(clampGuestbookEntryContent(event.target.value))
            }
            placeholder="Sign the Guest Book…"
            spellCheck={false}
            aria-label="Guest Book message"
            maxLength={MAX_GUESTBOOK_ENTRY_CHARS}
          />
          <div className="flex items-center justify-between gap-2 px-2 py-0.5">
            <span className="text-[11px] text-win-dark" aria-live="polite">
              <span aria-label="Character count">
                {charCount}/{MAX_GUESTBOOK_ENTRY_CHARS}
                {atCharLimit ? " (limit reached)" : ""}
              </span>
              <span aria-hidden="true"> · </span>
              <span aria-label="Daily sign count">
                {signsToday}/{MAX_GUESTBOOK_SIGNS_PER_HOST_PER_UTC_DAY} today
              </span>
            </span>
            <button
              type="button"
              className="win-raised px-3 py-0.5 disabled:opacity-50"
              disabled={!draft.trim() || atDailyLimit}
              onClick={() => {
                if (atDailyLimit) {
                  setShowDailyLimit(true);
                  return;
                }
                onSign();
              }}
            >
              Sign
            </button>
          </div>
        </div>
      ) : (
        <div className="shrink-0 border-t border-win-dark px-2 py-1 text-[11px] text-win-dark">
          Your book — visitors sign when they Visit PC.
        </div>
      )}

      {showDailyLimit ? (
        <ConfirmDialog
          title="Guest Book"
          message={`You have reached the daily limit of ${MAX_GUESTBOOK_SIGNS_PER_HOST_PER_UTC_DAY} messages on this PC (${signsToday}/${MAX_GUESTBOOK_SIGNS_PER_HOST_PER_UTC_DAY}).\n\nThe limit resets at midnight UTC.`}
          confirmLabel="OK"
          showCancel={false}
          onConfirm={() => setShowDailyLimit(false)}
          onCancel={() => setShowDailyLimit(false)}
        />
      ) : null}
      {pendingDeleteId ? (
        <ConfirmDialog
          title="Guest Book"
          message="Delete this signature?"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      ) : null}
    </div>
  );
}
