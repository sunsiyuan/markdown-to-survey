import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    {
      url: 'https://www.humansurvey.co',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://www.humansurvey.co/docs',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://www.humansurvey.co/faq',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: 'https://www.humansurvey.co/use-cases',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: 'https://www.humansurvey.co/use-cases/community-feedback',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://www.humansurvey.co/use-cases/product-launch',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://www.humansurvey.co/use-cases/events',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://www.humansurvey.co/changelog',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://www.humansurvey.co/llms.txt',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://www.humansurvey.co/llms-full.txt',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://www.humansurvey.co/faq.md',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: 'https://www.humansurvey.co/use-cases.md',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://www.humansurvey.co/use-cases/community-feedback.md',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://www.humansurvey.co/use-cases/product-launch.md',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://www.humansurvey.co/use-cases/events.md',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]
}
