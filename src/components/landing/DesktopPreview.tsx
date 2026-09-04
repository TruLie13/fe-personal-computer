/** Static placeholder for the product screenshot (video later). */
export function DesktopPreview() {
  return (
    <div
      className="my-3 inline-block border-2 border-black bg-[#008080] p-1"
      role="img"
      aria-label="Preview of a Teal95 writer desktop with story files"
    >
      <div className="border border-white bg-[#c0c0c0] p-0.5">
        <div className="flex items-center gap-1 bg-[#000080] px-1 py-0.5 text-[11px] text-white">
          <span className="font-sans">welcome - Notepad</span>
          <span className="ml-auto font-sans">×</span>
        </div>
        <div className="bg-white p-2 font-sans text-[11px] text-black">
          <p className="mb-1 font-bold">C:\users\maya\welcome</p>
          <p>
            Rain on the bus window. Someone else&apos;s playlist leaking through
            one earbud.
          </p>
          <p className="mt-2 text-[#808080]">— a file on Maya&apos;s PC</p>
        </div>
      </div>
      <p className="mt-1 text-center font-serif text-[12px] text-black">
        [ desktop preview — demo video coming later ]
      </p>
    </div>
  );
}
