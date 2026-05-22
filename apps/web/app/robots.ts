import type { MetadataRoute } from 'next'

const BASE = 'https://www.humansurvey.co'

// HumanSurvey is built for AI agents, so crawling — including by AI crawlers —
// is welcome. The one carve-out is /s/ (per-survey respondent pages): they are
// noindex by design and are not site content.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/s/',
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
