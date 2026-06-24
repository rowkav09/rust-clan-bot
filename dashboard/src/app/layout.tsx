import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RustClan Bot — The Ultimate Clan Management Bot',
  description: 'Track playtime, coordinate raids, manage your clan — all from Discord. The most feature-rich Rust clan management bot.',
  keywords: ['Rust', 'Discord bot', 'clan management', 'time tracking', 'leaderboard'],
  openGraph: {
    title: 'RustClan Bot',
    description: 'The ultimate Discord bot for Rust clan management.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">{children}</body>
    </html>
  )
}
