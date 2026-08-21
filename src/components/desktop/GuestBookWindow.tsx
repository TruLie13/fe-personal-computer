"use client";

import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/desktop/ConfirmDialog";
import { DeleteIcon, PlusIcon } from "@/components/desktop/icons";
import {
  MasterDetail,
  MasterDetailListItem,
  MasterDetailPane,
} from "@/components/desktop/MasterDetail";
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
import type { GuestbookEntry } from "@/types/network";

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

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
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

  const effectiveSelectedId = selectedId ?? entries[0]?.id ?? null;
  const selected: GuestbookEntry | undefined = entries.find(
    (entry) => entry.id === effectiveSelectedId,
  );

  const canVisitAuthor =
    selected != null &&
    selected.authorId !== LOCAL_USER_ID &&
    Boolean(getNetworkUser(selected.authorId));
  const canDeleteSelected =
    selected != null &&
    (selected.authorId === LOCAL_USER_ID ||
      (isOwnBook && selected.hostUserId === LOCAL_USER_ID));

  const charCount = draft.length;
  const atCharLimit = charCount >= MAX_GUESTBOOK_ENTRY_CHARS;

  const onSignClick = () => {
    if (!canSign) {
      return;
    }
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
      setComposing(false);
      return;
    }
    const id = signGuestbook(hostUserId, content);
    if (!id) {
      setShowDailyLimit(true);
      setComposing(false);
      return;
    }
    setDraft("");
    setComposing(false);
    setSelectedId(id);
  };

  const requestDelete = () => {
    if (!selected || !canDeleteSelected) {
      return;
    }
    setPendingDeleteId(selected.id);
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) {
      return;
    }
    const deletedId = pendingDeleteId;
    const ok = deleteGuestbookEntry(deletedId);
    setPendingDeleteId(null);
    if (!ok) {
      return;
    }
    const remaining = mergeGuestbookOldestFirst(
      hostUserId,
      useDesktopStore.getState().localGuestbookEntries,
    );
    setSelectedId(remaining[0]?.id ?? null);
  };

  const detailAction = (() => {
    if (canVisitAuthor && selected) {
      return <VisitPcButton userId={selected.authorId} />;
    }
    if (canDeleteSelected) {
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

  const hostLabel =
    hostUserId === LOCAL_USER_ID
      ? "this PC"
      : (getNetworkUser(hostUserId)?.displayName ?? hostUserId);

  return (
    <div className="relative h-full min-h-0">
      <MasterDetail
        header={
          <>
            <span className="min-w-0 flex-1 text-win-dark">
              Guest Book — messages left on {hostLabel}
            </span>
            {canSign ? (
              <button
                type="button"
                className="win-raised flex items-center gap-1 px-2 py-0.5"
                onClick={onSignClick}
              >
                {composing ? (
                  "Cancel"
                ) : (
                  <>
                    <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                      <PlusIcon size={14} />
                    </span>
                    Sign…
                  </>
                )}
              </button>
            ) : null}
          </>
        }
        aboveSplit={
          composing && canSign ? (
            <div className="flex flex-col border-b border-win-dark">
              <div className="p-2">
                <textarea
                  className="win-sunken min-h-[88px] w-full resize-none bg-win-paper p-2 text-win-ink outline-none"
                  value={draft}
                  onChange={(event) =>
                    setDraft(clampGuestbookEntryContent(event.target.value))
                  }
                  placeholder="Leave a short message for this PC…"
                  spellCheck={false}
                  aria-label="Guest Book message"
                  maxLength={MAX_GUESTBOOK_ENTRY_CHARS}
                />
              </div>
              <div className="relative z-10 flex shrink-0 items-center justify-between gap-2 border-t border-win-dark px-2 py-0.5">
                <span
                  className="text-[11px] text-win-dark"
                  aria-live="polite"
                >
                  <span aria-label="Character count">
                    {charCount}/{MAX_GUESTBOOK_ENTRY_CHARS}
                    {atCharLimit ? " (limit reached)" : ""}
                  </span>
                  <span aria-hidden="true"> · </span>
                  <span aria-label="Daily sign count">
                    {signsToday}/{MAX_GUESTBOOK_SIGNS_PER_HOST_PER_UTC_DAY}{" "}
                    today
                  </span>
                </span>
                <button
                  type="button"
                  className="win-raised px-3 py-0.5 disabled:opacity-50"
                  disabled={!draft.trim()}
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={onSign}
                >
                  Sign
                </button>
              </div>
            </div>
          ) : null
        }
        list={
          entries.length === 0 ? (
            <p className="p-2 text-win-paper-muted">
              {canSign
                ? "No messages yet. Be the first to sign."
                : "No messages yet. Visitors can sign when they Visit PC."}
            </p>
          ) : (
            <ul className="list-none">
              {entries.map((entry) => {
                const active = entry.id === effectiveSelectedId;
                return (
                  <MasterDetailListItem
                    key={entry.id}
                    active={active}
                    onSelect={() => setSelectedId(entry.id)}
                    title={
                      <span className="min-w-0 flex-1 truncate">
                        {authorDisplayName(entry.authorId)}
                      </span>
                    }
                    meta={formatShortDateTime(entry.createdAt)}
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
                    title: authorDisplayName(selected.authorId),
                    authorLabel: formatShortDateTime(selected.createdAt),
                    content: selected.content,
                  }
                : null
            }
            emptyMessage="Select a message to read."
            showHeading
            action={detailAction}
          />
        }
      />
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
          message="Delete this message?"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      ) : null}
    </div>
  );
}
