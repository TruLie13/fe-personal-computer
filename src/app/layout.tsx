import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Computer",
  description: "A retro desktop for writers, poets, and creatives.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
