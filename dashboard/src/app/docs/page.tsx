import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { BookOpen, Terminal, Zap, Radio, Settings, ChevronRight, Clock, Search } from 'lucide-react'

const sections = [
  {
    icon: BookOpen,
    title: 'Setup Guide',
    desc: 'Get the bot running in your server in under 10 minutes. Covers roles, channels, BattleMetrics, and Rust+.',
    href: '/docs/setup',
    badge: 'Start here',
    badgeColor: 'bg-green-500/20 text-green-400',
    time: '10 min read',
  },
  {
    icon: Terminal,
    title: 'Commands Reference',
    desc: 'Full reference for all 40+ slash commands. Includes required permissions, parameters, and examples.',
    href: '/docs/commands',
    badge: null,
    badgeColor: '',
    time: '5 min read',
  },
  {
    icon: Zap,
    title: 'Stage Manager',
    desc: 'How to configure wipe stages and auto-assign tasks to members by specialist role when they come online.',
    href: '/docs/stages',
    badge: 'Pro',
    badgeColor: 'bg-purple-500/20 text-purple-400',
    time: '5 min read',
  },
  {
    icon: Radio,
    title: 'Rust+ Integration',
    desc: 'Pair the bot with your Rust server for live team chat, heli/cargo alerts, and smart alarm notifications.',
    href: '/docs/rustplus',
    badge: 'Pro',
    badgeColor: 'bg-purple-500/20 text-purple-400',
    time: '8 min read',
  },
  {
    icon: Settings,
    title: 'API Keys & Integrations',
    desc: 'Bring your own Steam API key and BattleMetrics token for auto-tracking and application hour verification.',
    href: '/docs/integrations',
    badge: null,
    badgeColor: '',
    time: '3 min read',
  },
]

const popularArticles = [
  { title: 'Why is my leaderboard not posting?', href: '/docs/setup' },
  { title: 'How do I reset wipe stats?', href: '/docs/commands' },
  { title: 'BattleMetrics sync not working', href: '/docs/integrations' },
  { title: 'Rust+ shows disconnected after wipe', href: '/docs/rustplus' },
  { title: 'How auto-assignment works', href: '/docs/stages' },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-dark-800 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-label mb-3">Documentation</div>
            <h1 className="text-4xl font-black text-white mb-4">How can we help?</h1>
            <p className="text-gray-400 max-w-xl mx-auto">
              Everything you need to set up, configure, and get the most out of RustClanBot.
            </p>
          </div>

          {/* Search (visual placeholder) */}
          <div className="relative mb-12">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-dark-600 border border-dark-300 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-rust-500/50"
              placeholder="Search documentation…"
              readOnly
            />
          </div>

          {/* Doc sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {sections.map(s => (
              <Link key={s.href} href={s.href} className="card-hover group flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-dark-500 border border-dark-300 flex items-center justify-center shrink-0">
                  <s.icon size={18} className="text-gray-400 group-hover:text-rust-400 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-sm">{s.title}</span>
                    {s.badge && (
                      <span className={`badge ${s.badgeColor} text-[10px]`}>{s.badge}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-2">{s.desc}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-700">
                    <Clock size={10} />
                    {s.time}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-700 group-hover:text-rust-400 transition-colors shrink-0 mt-1" />
              </Link>
            ))}
          </div>

          {/* Popular articles */}
          <div className="card border-dark-300">
            <h2 className="text-sm font-semibold text-white mb-4">Popular articles</h2>
            <div className="space-y-1">
              {popularArticles.map(a => (
                <Link key={a.title} href={a.href}
                  className="flex items-center gap-2 py-2 px-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-500 transition-all group">
                  <ChevronRight size={13} className="text-gray-700 group-hover:text-rust-400 transition-colors shrink-0" />
                  {a.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
