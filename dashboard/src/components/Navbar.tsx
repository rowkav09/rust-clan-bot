'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flame, Menu, X } from 'lucide-react'
import { useState } from 'react'

const navLinks = [
  { href: '/#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/docs/setup', label: 'Docs' },
  { href: '/dashboard', label: 'Dashboard' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isDashboard = pathname?.startsWith('/dashboard')

  if (isDashboard) return null

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-dark-400 bg-dark-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-rust-gradient flex items-center justify-center shadow-lg shadow-rust-500/25">
              <Flame className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">RustClan<span className="text-rust-500">Bot</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="btn-ghost text-sm">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/dashboard" className="btn-secondary text-sm">
              View Demo
            </Link>
            <a
              href="#"
              className="btn-primary text-sm"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.085.118 18.1.135 18.1a19.843 19.843 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Add to Discord
            </a>
          </div>

          <button onClick={() => setOpen(o => !o)} className="md:hidden p-2 text-gray-400 hover:text-white">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-dark-400 bg-dark-700 px-4 py-4 flex flex-col gap-2">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="text-gray-300 hover:text-white py-2 text-sm font-medium">
              {l.label}
            </Link>
          ))}
          <div className="border-t border-dark-400 pt-3 mt-1 flex flex-col gap-2">
            <Link href="/dashboard" onClick={() => setOpen(false)} className="btn-secondary text-sm w-full justify-center">View Demo</Link>
            <a href="#" className="btn-primary text-sm w-full justify-center">Add to Discord</a>
          </div>
        </div>
      )}
    </header>
  )
}
