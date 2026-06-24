import Link from 'next/link'
import { Flame } from 'lucide-react'

const links = {
  Product: [
    { label: 'Features',   href: '/#features',   external: false },
    { label: 'Pricing',    href: '/pricing',      external: false },
    { label: 'Changelog',  href: '/changelog',    external: false },
    { label: 'Roadmap',    href: '/roadmap',      external: false },
    { label: 'Status',     href: '/status',       external: false },
  ],
  Resources: [
    { label: 'Docs',           href: '/docs',              external: false },
    { label: 'Setup Guide',    href: '/docs/setup',        external: false },
    { label: 'Commands',       href: '/docs/commands',     external: false },
    { label: 'Integrations',   href: '/docs/integrations', external: false },
    { label: 'Rust+ Guide',    href: '/docs/rustplus',     external: false },
  ],
  Community: [
    { label: 'Discord Server', href: 'https://discord.gg/placeholder', external: true },
    { label: 'GitHub',         href: 'https://github.com/placeholder', external: true },
    { label: 'Subreddit',      href: 'https://reddit.com/placeholder', external: true },
    { label: 'Twitter / X',    href: 'https://twitter.com/placeholder',external: true },
  ],
  Legal: [
    { label: 'Privacy Policy',    href: '/privacy', external: false },
    { label: 'Terms of Service',  href: '/terms',   external: false },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-dark-400 bg-dark-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-rust-gradient flex items-center justify-center">
                <Flame size={16} className="text-white" />
              </div>
              <span className="font-bold text-white">RustClan<span className="text-rust-500">Bot</span></span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-4 max-w-xs">
              The ultimate Discord bot for Rust clan management, tracking, and coordination.
            </p>
            <a
              href="https://discord.gg/placeholder"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#5865F2]/15 border border-[#5865F2]/30 text-[#7289da] text-xs font-semibold hover:bg-[#5865F2]/25 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.085.118 18.1.135 18.1a19.843 19.843 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Support Server
            </a>
          </div>

          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {items.map(item => (
                  <li key={item.label}>
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link href={item.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-dark-400 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} RustClanBot. Not affiliated with Facepunch Studios or Discord Inc.
          </p>
          <p className="text-sm text-gray-600">
            Built for the Rust community
          </p>
        </div>
      </div>
    </footer>
  )
}
