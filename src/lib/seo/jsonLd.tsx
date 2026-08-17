import type { TextDocument } from "@/types/desktop";
import type { NetworkUser } from "@/types/network";
import { fileUrl, profileUrl } from "@/lib/seo/paths";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function profileJsonLd(user: NetworkUser): Record<string, unknown> {
  const url = profileUrl(user.id);
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${user.displayName}'s Computer`,
    url,
    mainEntity: {
      "@type": "Person",
      name: user.displayName,
      description: user.bio,
      url,
    },
  };
}

export function fileJsonLd(
  user: NetworkUser,
  document: TextDocument,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    headline: document.title,
    text: document.content,
    dateCreated: document.createdAt,
    dateModified: document.updatedAt,
    url: fileUrl(user.id, document.slug),
    author: {
      "@type": "Person",
      name: user.displayName,
      url: profileUrl(user.id),
    },
    isPartOf: {
      "@type": "ProfilePage",
      url: profileUrl(user.id),
    },
  };
}

export function truncateDescription(text: string, max = 160): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) {
    return flat;
  }
  return `${flat.slice(0, max - 1)}…`;
}
