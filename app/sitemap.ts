import type { MetadataRoute } from "next"

const SITE_URL = "https://oluwamayowa.vercel.app"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date("2026-07-30"),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/research/frontier-model-deployment-study`,
      lastModified: new Date("2026-07-30"),
      changeFrequency: "yearly",
      priority: 0.9,
    },
  ]
}
