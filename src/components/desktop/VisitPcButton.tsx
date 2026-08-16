"use client";

import { ComputerIcon } from "@/components/desktop/icons";
import { useDesktopStore } from "@/store/desktopStore";
import type { NetworkUserId } from "@/types/network";

interface VisitPcButtonProps {
  userId: NetworkUserId;
  className?: string;
}

export function VisitPcButton({ userId, className = "" }: VisitPcButtonProps) {
  const visitRemotePc = useDesktopStore((state) => state.visitRemotePc);

  return (
    <button
      type="button"
      className={`win-raised flex items-center gap-1 px-2 py-0.5 ${className}`.trim()}
      onClick={() => visitRemotePc(userId)}
    >
      <span className="inline-block h-3.5 w-3.5 shrink-0 overflow-hidden">
        <ComputerIcon size={14} />
      </span>
      Visit PC
    </button>
  );
}
