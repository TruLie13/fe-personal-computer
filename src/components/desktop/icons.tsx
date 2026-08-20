interface IconProps {
  className?: string;
  size?: number;
}

export function ComputerIcon({ className, size = 32 }: IconProps) {
  // Favicon mirrors this art: `src/app/icon.svg`
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      // SVG strokes can paint past the layout box; clip so neighbors stay readable.
      style={{ display: "block", overflow: "hidden", flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Inset so 1px strokes stay inside the 32×32 viewBox when scaled. */}
      <rect x="4" y="5" width="24" height="16" fill="#c0c0c0" stroke="#000" />
      <rect x="7" y="8" width="18" height="10" fill="#008080" />
      <rect x="12" y="22" width="8" height="3" fill="#c0c0c0" stroke="#000" />
      <rect x="8" y="25" width="16" height="3" fill="#c0c0c0" stroke="#000" />
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
      {/* Spiral pad — cream + blue margin, not a loose document. */}
      <rect x="5" y="3" width="22" height="27" fill="#fff8dc" stroke="#000" />
      <rect x="8" y="1" width="4" height="5" fill="#808080" stroke="#000" />
      <rect x="14" y="1" width="4" height="5" fill="#808080" stroke="#000" />
      <rect x="20" y="1" width="4" height="5" fill="#808080" stroke="#000" />
      <path d="M11 3.5v27" stroke="#0000ff" strokeWidth="1.5" />
      <path
        d="M14 11h10M14 15h10M14 19h10M14 23h7"
        stroke="#000"
        strokeWidth="1"
      />
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

export function BulletinBoardIcon({ className, size = 32 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      {/* Cork board with pinned slips — not a clipboard/document. */}
      <rect x="2" y="3" width="28" height="26" fill="#8b6914" stroke="#000" />
      <rect x="4" y="5" width="24" height="22" fill="#c4a35a" stroke="#000" />
      <rect x="6" y="7" width="10" height="9" fill="#fff8dc" stroke="#000" />
      <circle cx="11" cy="8" r="1.25" fill="#c00000" stroke="#000" />
      <rect x="15" y="12" width="11" height="8" fill="#ffd0e0" stroke="#000" />
      <circle cx="20.5" cy="13" r="1.25" fill="#000080" stroke="#000" />
      <rect x="8" y="18" width="9" height="7" fill="#d0e8ff" stroke="#000" />
      <circle cx="12.5" cy="19" r="1.25" fill="#008000" stroke="#000" />
    </svg>
  );
}

/** Small pin+slip for Bulletin Board list rows (distinct from .txt files). */
export function BbsPinIcon({ className, size = 32 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <rect x="6" y="8" width="20" height="20" fill="#fff8dc" stroke="#000" />
      <path d="M10 14h12M10 18h12M10 22h8" stroke="#000" />
      <circle cx="16" cy="6" r="4" fill="#c00000" stroke="#000" />
      <path d="M16 10v4" stroke="#000" strokeWidth="2" />
    </svg>
  );
}

export function NetworkIcon({ className, size = 32 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      {/* Larger CRTs so the neighborhood reads at desktop size. */}
      <rect x="1" y="2" width="14" height="12" fill="#c0c0c0" stroke="#000" />
      <rect x="3" y="4" width="10" height="7" fill="#008080" />
      <rect x="5" y="14" width="6" height="2" fill="#c0c0c0" stroke="#000" />
      <rect x="17" y="2" width="14" height="12" fill="#c0c0c0" stroke="#000" />
      <rect x="19" y="4" width="10" height="7" fill="#000080" />
      <rect x="21" y="14" width="6" height="2" fill="#c0c0c0" stroke="#000" />
      <rect x="9" y="17" width="14" height="12" fill="#c0c0c0" stroke="#000" />
      <rect x="11" y="19" width="10" height="7" fill="#800080" />
      <rect x="13" y="29" width="6" height="2" fill="#c0c0c0" stroke="#000" />
      <path d="M8 16h16M16 16v1" stroke="#000" fill="none" />
    </svg>
  );
}

export function StoryExplorerIcon({ className, size = 32 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      {/* Open book + glass — distinct from Notepad pad and .txt page. */}
      <path
        d="M3 6l11 3v18L3 24V6z"
        fill="#000080"
        stroke="#000"
      />
      <path
        d="M29 6L18 9v18l11-3V6z"
        fill="#000080"
        stroke="#000"
      />
      <path d="M4 7.5l9 2.5v15L4 22.5V7.5z" fill="#fff8dc" stroke="#000" />
      <path d="M28 7.5L19 10v15l9-2.5V7.5z" fill="#fff" stroke="#000" />
      <path d="M14 9v18M18 9v18" stroke="#000" />
      <path d="M6 12h5M6 16h5M6 20h4" stroke="#000" />
      <path d="M21 13h5M21 17h5M21 21h3" stroke="#000" />
      <circle cx="23" cy="24" r="5.5" fill="#c0c0c0" stroke="#000" />
      <circle cx="23" cy="24" r="2.75" fill="none" stroke="#000" />
      <path d="M27 28l3 3" stroke="#000" strokeWidth="2" />
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

export function UpFolderIcon({ className, size = 32 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <path
        d="M4 12h8l2 3h14v13H4V12z"
        fill="#f8d568"
        stroke="#000"
        strokeWidth="1"
      />
      <path d="M4 15h24v13H4z" fill="#e8b830" stroke="#000" />
      <path
        d="M16 4v10M11 9l5-5 5 5"
        fill="none"
        stroke="#008000"
        strokeWidth="2"
        strokeLinejoin="miter"
      />
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
    case "bbs":
      return BulletinBoardIcon;
    case "stories":
      return StoryExplorerIcon;
    case "network":
      return NetworkIcon;
    case "profile":
      return ComputerIcon;
    case "system":
    case "about":
    default:
      return ComputerIcon;
  }
}
