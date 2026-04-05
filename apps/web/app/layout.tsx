import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'Markdown to Survey',
  description: 'Convert Markdown into interactive surveys.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col bg-white text-slate-900">
        {children}
      </body>
    </html>
  )
}
