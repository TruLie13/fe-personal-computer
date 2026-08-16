interface IconProps {
  className?: string;
  size?: number;
}

export function ComputerIcon({ className, size = 32 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="26" height="18" fill="#c0c0c0" stroke="#000" />
      <rect x="6" y="7" width="20" height="12" fill="#008080" />
      <rect x="11" y="22" width="10" height="3" fill="#c0c0c0" stroke="#000" />
      <rect x="7" y="25" width="18" height="3" fill="#c0c0c0" stroke="#000" />
    </svg>
  );
}

export function FolderIcon({ className, size = 32 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <path
        d="M4 10h8l2 3h14v13H4V10z"
        fill="#f8d568"
        stroke="#000"
        strokeWidth="1"
      />
      <path d="M4 13h24v13H4z" fill="#e8b830" stroke="#000" />
    </svg>
  );
}

export function TextFileIcon({ className, size = 32 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <path
        d="M8 3h11l7 7v19H8V3z"
        fill="#fff"
        stroke="#000"
        strokeWidth="1"
      />
      <path d="M19 3v7h7" fill="none" stroke="#000" />
      <path d="M11 15h10M11 19h10M11 23h7" stroke="#000" strokeWidth="1" />
    </svg>
  );
}

export function NotepadIcon({ className, size = 32 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <rect x="6" y="2" width="20" height="28" fill="#fff8dc" stroke="#000" />
      <rect x="9" y="0" width="3" height="5" fill="#c0c0c0" stroke="#000" />
      <rect x="14" y="0" width="3" height="5" fill="#c0c0c0" stroke="#000" />
      <rect x="19" y="0" width="3" height="5" fill="#c0c0c0" stroke="#000" />
      <path d="M10 10h12M10 14h12M10 18h12M10 22h8" stroke="#000" />
    </svg>
  );
}

export function DisplayIcon({ className, size = 32 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="26" height="18" fill="#c0c0c0" stroke="#000" />
      <rect x="6" y="7" width="20" height="12" fill="#008080" />
      <rect x="6" y="7" width="8" height="5" fill="#000080" />
      <rect x="11" y="22" width="10" height="3" fill="#c0c0c0" stroke="#000" />
      <rect x="7" y="25" width="18" height="3" fill="#c0c0c0" stroke="#000" />
      <rect x="20" y="14" width="4" height="4" fill="#ff0000" stroke="#000" />
      <rect x="17" y="17" width="4" height="4" fill="#00a800" stroke="#000" />
    </svg>
  );
}

export function StartLogo({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="6" height="6" fill="#ff0000" />
      <rect x="9" y="1" width="6" height="6" fill="#00a800" />
      <rect x="1" y="9" width="6" height="6" fill="#0000ff" />
      <rect x="9" y="9" width="6" height="6" fill="#ffff00" />
    </svg>
  );
}

export function iconForType(type: string) {
  switch (type) {
    case "folder":
      return FolderIcon;
    case "text":
      return TextFileIcon;
    case "editor":
      return NotepadIcon;
    case "display":
      return DisplayIcon;
    case "system":
    case "about":
    default:
      return ComputerIcon;
  }
}
