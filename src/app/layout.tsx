import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Pokemon TCG Pack Opener',
  description: 'Simulate opening classic Pokemon TCG booster packs',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-gray-950 text-white">
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link
              href="/"
              className="bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-lg font-extrabold tracking-tight text-transparent"
            >
              ⚡ Pack Opener
            </Link>
            <div className="flex gap-6">
              <Link
                href="/"
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                Home
              </Link>
              <Link
                href="/collection"
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                Collection
              </Link>
            </div>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
