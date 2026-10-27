import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
  ];
}
