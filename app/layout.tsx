import React from "react"
import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F7F5' },
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
  ],
}

export const metadata: Metadata = {
  title: 'Saibun - BSV UTXO Splitter',
  description: 'A minimal, offline-capable tool for splitting UTXOs on the BSV blockchain. Generate keys, build transactions, and broadcast or download - all with precision.',
  keywords: ['BSV', 'UTXO', 'Bitcoin', 'Splitter', 'Offline', 'Transaction'],
  authors: [{ name: 'Saibun' }],
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
