"use client";

import type { ReactNode } from "react";
import { ComputerIcon } from "@/components/desktop/icons";
import { VisitPcButton } from "@/components/desktop/VisitPcButton";
import { remoteDesktopPath } from "@/lib/networkSeed";
import type { NetworkUser } from "@/types/network";

const PC_ICON_SIZE = 20;

/** Full-size list icon that cannot paint over neighboring text. */
function PcListIcon() {
  return (
    <span
      className="shrink-0"
      style={{
        display: "inline-block",
        width: PC_ICON_SIZE,
        height: PC_ICON_SIZE,
        overflow: "hidden",
        contain: "paint",
        lineHeight: 0,
      }}
    >
      <ComputerIcon size={PC_ICON_SIZE} />
    </span>
  );
}

interface NetworkPcRowProps {
  user: NetworkUser;
  pathLabel?: string;
  actions: ReactNode;
}

export function NetworkPcRow({
  user,
  pathLabel,
  actions,
}: NetworkPcRowProps) {
  return (
    <li className="flex items-center gap-2 px-1 py-1 hover:bg-win-paper-hover">
      <PcListIcon />
      <div className="min-w-0 flex-1 pl-2">
        <div className="truncate font-bold">{user.displayName}</div>
        <div className="truncate text-win-paper-muted">
          {pathLabel ?? remoteDesktopPath(user)}
        </div>
      </div>
      <VisitPcButton userId={user.id} />
      {actions}
    </li>
  );
}

interface LocalPcRowProps {
  title: string;
  subtitle: string;
}

/** Non-visitable "This PC" row in Network Neighborhood. */
export function LocalPcRow({ title, subtitle }: LocalPcRowProps) {
  return (
    <li className="flex items-center gap-2 px-1 py-1 text-win-paper-muted">
      <PcListIcon />
      <div className="min-w-0 flex-1 pl-2">
        <div className="font-bold text-win-ink">{title}</div>
        <div>{subtitle}</div>
      </div>
    </li>
  );
}
