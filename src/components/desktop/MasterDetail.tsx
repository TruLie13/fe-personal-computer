import type { ReactNode } from "react";

interface MasterDetailProps {
  header: ReactNode;
  list: ReactNode;
  detail: ReactNode;
}

/** Win95-style left list + right detail layout (Story Explorer). */
export function MasterDetail({ header, list, detail }: MasterDetailProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-win-face text-[12px]">
      <div className="flex items-center gap-2 border-b border-win-dark px-2 py-1">
        {header}
      </div>
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
            subtitle != null ? "mb-1.5" : ""
          } ${active ? "text-white/90" : "text-win-paper-muted"}`}
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
  /** When false, omit title/author (list already shows them). Default true. */
  showHeading?: boolean;
}

export function MasterDetailPane({
  item,
  emptyMessage,
  action,
  showHeading = true,
}: MasterDetailPaneProps) {
  if (!item) {
    return (
      <div className="win-sunken flex flex-1 items-center justify-center bg-win-paper text-win-paper-muted">
        {emptyMessage}
      </div>
    );
  }

  const toolbar =
    showHeading || action != null ? (
      <div
        className={`mb-1 flex shrink-0 gap-2 ${
          showHeading ? "items-start" : "items-center justify-end"
        }`}
      >
        {showHeading ? (
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold">{item.title}</div>
            <div className="truncate text-win-dark">{item.authorLabel}</div>
          </div>
        ) : null}
        {action != null ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
            {action}
          </div>
        ) : null}
      </div>
    ) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {toolbar}
      <div className="win-sunken min-h-0 flex-1 overflow-auto whitespace-pre-wrap bg-win-paper p-2 leading-5 text-win-ink">
        {item.content}
      </div>
    </div>
  );
}
