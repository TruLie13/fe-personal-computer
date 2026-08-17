import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Desktop } from "@/components/desktop/Desktop";
import { LOCAL_USER_ID } from "@/lib/networkSeed";
import {
  fileMetaTitle,
  notFoundMetaTitle,
} from "@/lib/seo/brand";
import {
  fileJsonLd,
  JsonLd,
  truncateDescription,
} from "@/lib/seo/jsonLd";
import { fileUrl, isLocalUsername } from "@/lib/seo/paths";
import { resolvePublicFile } from "@/lib/seo/publicContent";
import { isReservedFileSlug } from "@/lib/seo/slugs";
import { DEFAULT_LOCAL_PROFILE } from "@/lib/profile";

interface FilePageProps {
  params: Promise<{ username: string; fileSlug: string }>;
}

export async function generateMetadata({
  params,
}: FilePageProps): Promise<Metadata> {
  const { username, fileSlug } = await params;
  if (isLocalUsername(username)) {
    if (isReservedFileSlug(fileSlug)) {
      return { title: notFoundMetaTitle("file") };
    }
    return {
      title: fileMetaTitle(fileSlug, DEFAULT_LOCAL_PROFILE.displayName),
      robots: { index: false, follow: false },
      alternates: { canonical: fileUrl(LOCAL_USER_ID, fileSlug) },
    };
  }
  const record = resolvePublicFile(username, fileSlug);
  if (!record) {
    return { title: notFoundMetaTitle("file") };
  }
  return {
    title: fileMetaTitle(record.document.title, record.user.displayName),
    description: truncateDescription(record.document.content),
    alternates: {
      canonical: fileUrl(record.user.id, record.document.slug),
    },
  };
}

export default async function UserFilePage({ params }: FilePageProps) {
  const { username, fileSlug } = await params;

  if (isLocalUsername(username)) {
    if (isReservedFileSlug(fileSlug)) {
      notFound();
    }
    return (
      <Desktop
        deepLinkUsername={LOCAL_USER_ID}
        deepLinkFileSlug={fileSlug}
      />
    );
  }

  const record = resolvePublicFile(username, fileSlug);
  if (!record) {
    notFound();
  }

  return (
    <>
      <JsonLd data={fileJsonLd(record.user, record.document)} />
      <article className="seo-crawl-article">
        <h1>{record.document.title}</h1>
        <p>by {record.user.displayName}</p>
        <pre>{record.document.content}</pre>
      </article>
      <Desktop
        deepLinkUsername={record.user.id}
        deepLinkFileSlug={record.document.slug}
      />
    </>
  );
}
