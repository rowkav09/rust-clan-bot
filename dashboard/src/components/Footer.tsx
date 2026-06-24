import Link from 'next/link'
import { Flame } from 'lucide-react'

const links = {
  Product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Changelog', href: '#' },
    { label: 'Roadmap', href: '#' },
  ],
  Resources: [
    { label: 'Setup Guide', href: '/docs/setup' },
    { label: 'Commands', href: '#' },
    { label: 'API Reference', href: '#' },
    { label: 'Status', href: '#' },
  ],
  Community: [
    { label: 'Discord Server', href: '#' },
    { label: 'GitHub', href: '#' },
    { label: 'Reddit', href: '#' },
    { label: 'Twitter / X', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-dark-400 bg-dark-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-rust-gradient flex items-center justify-center">
                <Flame size={16} className="text-white" />
              </div>
              <span className="font-bold text-white">RustClan<span className="text-rust-500">Bot</span></span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              The ultimate Discord bot for Rust clan management, tracking, and coordination.
            </p>
          </div>

          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {items.map(item => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-dark-400 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} RustClanBot. Not affiliated with Facepunch Studios.
          </p>
          <p className="text-sm text-gray-600">
            Built with ❤️ for the Rust community
          </p>
        </div>
      </div>
    </footer>
  )
}
