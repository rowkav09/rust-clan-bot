'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Trophy, CheckSquare, Swords, Map, FileText,
  Settings, Flame, Bell, ChevronRight, ExternalLink, Wifi, Crown
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',            icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/members',    icon: Users,           label: 'Members' },
  { href: '/dashboard/leaderboard',icon: Trophy,          label: 'Leaderboard' },
  { href: '/dashboard/tasks',      icon: CheckSquare,     label: 'Tasks',       badge: '4' },
  { href: '/dashboard/raids',      icon: Swords,          label: 'Raids' },
  { href: '/dashboard/intel',      icon: Map,             label: 'Intel' },
  { href: '/dashboard/applications',icon: FileText,       label: 'Applications', badge: '2', badgeColor: 'bg-rust-500' },
  { href: '/dashboard/settings',   icon: Settings,        label: 'Settings' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-dark-700 border-r border-dark-400 flex flex-col z-40">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-dark-400">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-rust-gradient flex items-center justify-center shadow-lg shadow-rust-500/25">
            <Flame size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white">RustClan<span className="text-rust-500">Bot</span></span>
        </Link>
      </div>

      {/* Server selector */}
      <div className="px-3 py-3 border-b border-dark-400">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-500 border border-dark-300 cursor-pointer hover:border-dark-200 transition-all">
          <div className="w-6 h-6 rounded-md bg-rust-gradient flex items-center justify-center shrink-0">
            <Flame size={12} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">Iron Fist Clan</div>
            <div className="flex items-center gap-1 mt-0.5">
              <Wifi size={9} className="text-green-400" />
              <span className="text-[10px] text-green-400">Connected</span>
            </div>
          </div>
          <ChevronRight size={12} className="text-gray-600 shrink-0" />
        </div>
      </div>

      {/* Pro trial banner */}
      <div className="px-3 py-2.5 border-b border-dark-400">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rust-500/10 border border-rust-500/20">
          <Crown size={12} className="text-rust-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-rust-400">Pro Trial</div>
            <div className="text-[10px] text-gray-500">9 days remaining</div>
          </div>
          <Link href="/pricing" className="text-[9px] font-bold text-rust-400 border border-rust-500/30 rounded px-1.5 py-0.5 hover:bg-rust-500/20 transition-colors">
            UPGRADE
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all group ${
                active
                  ? 'bg-rust-500/15 text-white border border-rust-500/20'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-dark-500'
              }`}
            >
              <item.icon size={15} className={active ? 'text-rust-400' : 'text-gray-600 group-hover:text-gray-400'} />
              <span className="flex-1 font-medium">{item.label}</span>
              {item.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor ?? 'bg-dark-400 text-gray-400'} text-white`}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t border-dark-400 space-y-0.5">
        <Link href="#" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-dark-500 transition-all">
          <Bell size={14} className="text-gray-600" />
          Notifications
        </Link>
        <Link href="/" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-dark-500 transition-all">
          <ExternalLink size={14} className="text-gray-600" />
          Main site
        </Link>
      </div>
    </aside>
  )
}
