import type { Metadata } from "next";
import {
  SITE_DESCRIPTION,
  SITE_TITLE,
  TITLE_TEMPLATE,
} from "@/lib/seo/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
