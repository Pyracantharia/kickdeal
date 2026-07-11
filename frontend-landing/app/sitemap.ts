import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/config'

const routes = [
  { path: '/', priority: 1 },
  { path: '/contact', priority: 0.7 },
  { path: '/legal', priority: 0.5 },
  { path: '/legal/cgu', priority: 0.4 },
  { path: '/legal/confidentialite', priority: 0.4 },
  { path: '/legal/cookies', priority: 0.4 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.path === '/' ? 'weekly' : 'monthly',
    priority: route.priority,
  }))
}
