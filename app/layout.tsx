import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import profileData from '@/data/profile.json'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://oluwamayowa.vercel.app'),
  title: {
    default: profileData.header.name,
    template: `%s | ${profileData.header.name}`,
  },
  description: profileData.about.description,
  authors: [{ name: 'Mayowa Oladosu', url: 'https://oluwamayowa.vercel.app' }],
  creator: 'Mayowa Oladosu',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    title: profileData.header.name,
    description: profileData.about.description,
    siteName: profileData.header.name,
  },
  twitter: {
    card: 'summary',
    title: profileData.header.name,
    description: profileData.about.description,
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
