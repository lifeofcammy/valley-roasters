import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

/**
 * Public-facing routes Google should crawl. Keep this list in sync
 * whenever a new marketing/services/blog page lands. Auth-gated pages
 * (/portal/*, /admin/*) and the auth flow itself (/login, /register)
 * are intentionally excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Top-level marketing pages
  const marketing: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/wholesale`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  // Services — overview + 5 subpages (the wholesale consultation funnel)
  const services: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/services/origin-and-selection`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/services/custom-blend-development`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/services/menu-building`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/services/staff-training-and-operations`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/services/equipment-and-packaging`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];

  // Blog — index + 5 SEO-targeted long-form posts
  const blog: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/blog/single-origin-vs-blend`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/blog/how-to-design-a-custom-coffee-blend`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/blog/10-things-to-get-right-in-staff-training`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/blog/how-to-price-your-coffee-menu`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/blog/coffee-shop-equipment-checklist`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  return [...marketing, ...services, ...blog];
}
