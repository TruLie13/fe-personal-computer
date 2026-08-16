"use client";

import { ComputerIcon } from "@/components/desktop/icons";

interface ProfileAvatarProps {
  displayName: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

/** Profile picture when set; otherwise the classic computer icon. */
export function ProfileAvatar({
  displayName,
  avatarUrl,
  size = 32,
  className,
}: ProfileAvatarProps) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={className}
        src={avatarUrl}
        alt={displayName}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: "cover",
          border: "1px solid #000",
        }}
      />
    );
  }

  return <ComputerIcon className={className} size={size} />;
}
