import type { Metadata } from 'next'
import { IBM_Plex_Mono, Instrument_Sans } from 'next/font/google'

import './globals.css'

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.humansurvey.co'),
  title: 'HumanSurvey — Feedback collection for AI agents',
  description:
    'AI agents create surveys from JSON schema, collect structured feedback from groups of people, and retrieve machine-usable results via API or MCP.',
  applicationName: 'HumanSurvey',
  keywords: [
    'survey api',
    'mcp server',
    'ai agent tools',
    'feedback collection',
    'survey infrastructure',
    'json schema forms',
    'agent feedback',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'HumanSurvey — Feedback collection for AI agents',
    description:
      'Agents create surveys, groups of humans respond, agents get structured results back.',
    url: 'https://www.humansurvey.co',
    siteName: 'HumanSurvey',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HumanSurvey — Feedback collection for AI agents',
    description:
      'Agents create surveys from JSON schema, collect group feedback, retrieve structured results via API or MCP.',
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'HumanSurvey',
  applicationCategory: 'DeveloperApplication',
  description: 'Feedback collection infrastructure for AI agents',
  url: 'https://www.humansurvey.co',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${plexMono.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-[var(--background)] text-[var(--foreground)]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  )
}
