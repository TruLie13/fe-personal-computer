import type { ReactNode } from "react";

interface MasterDetailProps {
  header: ReactNode;
  /** Optional strip between header and the list/detail split (e.g. compose form). */
  aboveSplit?: ReactNode;
  list: ReactNode;
  detail: ReactNode;
}

/** Win95-style left list + right detail layout used by BBS and Story Explorer. */
export function MasterDetail({
  header,
  aboveSplit,
  list,
  detail,
}: MasterDetailProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-win-face text-[12px]">
      <div className="flex items-center gap-2 border-b border-win-dark px-2 py-1">
        {header}
      </div>
      {aboveSplit != null ? (
        <div className="shrink-0">{aboveSplit}</div>
      ) : null}
      <div className="flex min-h-0 flex-1">
        <div className="win-sunken m-1 w-[42%] overflow-auto bg-win-paper text-win-ink">
          {list}
        </div>
        <div className="m-1 flex min-w-0 flex-1 flex-col">{detail}</div>
      </div>
    </div>
  );
}

interface MasterDetailListItemProps {
  active: boolean;
  onSelect: () => void;
  title: ReactNode;
  meta: ReactNode;
  subtitle?: ReactNode;
}

export function MasterDetailListItem({
  active,
  onSelect,
  title,
  meta,
  subtitle,
}: MasterDetailListItemProps) {
  return (
    <li>
      <button
        type="button"
        className={`flex w-full flex-col gap-0.5 px-2 py-1.5 text-left ${
          active ? "bg-win-navy text-white" : "hover:bg-win-paper-hover"
        }`}
        onClick={onSelect}
      >
        <span className="flex items-center gap-2 font-bold">{title}</span>
        <span
          className={`truncate text-[11px] ${
            active ? "text-white/90" : "text-win-paper-muted"
          }`}
        >
          {meta}
        </span>
        {subtitle != null ? (
          <span
            className={`line-clamp-2 text-[11px] ${
              active ? "text-white/80" : "text-win-paper-muted"
            }`}
          >
            {subtitle}
          </span>
        ) : null}
      </button>
    </li>
  );
}

interface MasterDetailPaneProps {
  item: {
    title: string;
    authorLabel: string;
    content: string;
  } | null;
  emptyMessage: string;
  action?: ReactNode;
}

export function MasterDetailPane({
  item,
  emptyMessage,
  action,
}: MasterDetailPaneProps) {
  if (!item) {
    return (
      <div className="win-sunken flex flex-1 items-center justify-center bg-win-paper text-win-paper-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="font-bold">{item.title}</span>
        <span className="text-win-dark">{item.authorLabel}</span>
        {action}
      </div>
      <div className="win-sunken min-h-0 flex-1 overflow-auto whitespace-pre-wrap bg-win-paper p-2 leading-5 text-win-ink">
        {item.content}
      </div>
    </>
  );
}
