interface SetupSidebarArtProps {
  className?: string;
}

/** Original pixel scene for the Setup Wizard sidebar (not Microsoft art). */
export function SetupSidebarArt({ className }: SetupSidebarArtProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 88 220"
      width="118"
      height="294"
      aria-hidden="true"
    >
      <rect x="16" y="18" width="56" height="38" fill="#e8d0a8" stroke="#000" />
      <rect x="22" y="24" width="44" height="24" fill="#000080" />
      <rect x="38" y="56" width="12" height="6" fill="#e8d0a8" stroke="#000" />
      <rect x="24" y="62" width="40" height="8" fill="#c0c0c0" stroke="#000" />

      <rect x="10" y="78" width="28" height="36" fill="#c0c0c0" stroke="#000" />
      <rect x="14" y="84" width="20" height="8" fill="#808080" />
      <rect x="14" y="96" width="12" height="4" fill="#000" />
      <rect x="30" y="100" width="4" height="4" fill="#00a800" />

      <rect x="42" y="82" width="36" height="28" fill="#800080" stroke="#000" />
      <rect x="46" y="86" width="28" height="16" fill="#f8d568" />
      <path d="M48 108l8 10h20l-8-10H48z" fill="#e8b830" stroke="#000" />

      <rect x="12" y="128" width="22" height="14" fill="#000080" stroke="#000" />
      <rect x="14" y="130" width="6" height="6" fill="#c0c0c0" />
      <rect x="38" y="132" width="22" height="14" fill="#000080" stroke="#000" />
      <rect x="40" y="134" width="6" height="6" fill="#c0c0c0" />

      <rect x="22" y="156" width="28" height="36" fill="#fff8dc" stroke="#000" />
      <path d="M26 164h20M26 170h20M26 176h14" stroke="#000" />
      <rect x="52" y="168" width="4" height="22" fill="#000080" stroke="#000" />
      <rect x="50" y="164" width="8" height="6" fill="#c0c0c0" stroke="#000" />
    </svg>
  );
}
