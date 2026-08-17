import type { MetadataRoute } from "next";
import { fileUrl, profileUrl, siteOrigin } from "@/lib/seo/paths";
import { listPublicNetworkUsers } from "@/lib/seo/publicContent";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  const entries: MetadataRoute.Sitemap = [
    {
      url: origin,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  for (const user of listPublicNetworkUsers()) {
    entries.push({
      url: profileUrl(user.id),
      changeFrequency: "weekly",
      priority: 0.8,
    });
    for (const document of user.snapshot.documents) {
      entries.push({
        url: fileUrl(user.id, document.slug),
        lastModified: document.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
