import type { MetadataRoute } from "next";
import { fileUrl, profileUrl, siteOrigin } from "@/lib/seo/paths";
import { listPublicNetworkUsers } from "@/lib/seo/publicContent";
import {
  listPublicNetworkUsersAdmin,
  listPublicStoriesAdmin,
} from "@/lib/seo/publicContentAdmin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const entries: MetadataRoute.Sitemap = [
    {
      url: origin,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  let users = listPublicNetworkUsers();
  let stories: Awaited<ReturnType<typeof listPublicStoriesAdmin>> = [];
  try {
    users = await listPublicNetworkUsersAdmin();
    stories = await listPublicStoriesAdmin();
  } catch {
    // Emulator / Admin unavailable — seed-only sitemap.
  }

  const seenFileUrls = new Set<string>();

  for (const user of users) {
    entries.push({
      url: profileUrl(user.id),
      changeFrequency: "weekly",
      priority: 0.8,
    });
    for (const document of user.snapshot.documents) {
      const url = fileUrl(user.id, document.slug);
      seenFileUrls.add(url);
      entries.push({
        url,
        lastModified: document.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  for (const story of stories) {
    if (!story.slug) {
      continue;
    }
    const url = fileUrl(story.authorId, story.slug);
    if (seenFileUrls.has(url)) {
      continue;
    }
    entries.push({
      url,
      lastModified: story.publishedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}
