import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'
import AnimationProvider from '@/components/AnimationProvider'

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
        <AnimationProvider>
          <NavBar />
          <main className="flex-1">{children}</main>
        </AnimationProvider>
      </body>
    </html>
  )
}
