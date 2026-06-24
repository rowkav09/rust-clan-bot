import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Crown, Clock, Check, Circle } from 'lucide-react'

type Status = 'shipped' | 'in-progress' | 'planned' | 'considering'

const items: { status: Status; title: string; desc: string; pro?: boolean; quarter?: string }[] = [
  { status: 'shipped',     title: 'Stage Manager',           desc: 'Wipe-stage-based auto task assignment triggered by Rust+ online detection.',        pro: true,  quarter: 'Q2 2026' },
  { status: 'shipped',     title: 'Web Dashboard',           desc: 'Full admin panel for clan management without needing Discord commands.',              quarter: 'Q2 2026' },
  { status: 'shipped',     title: 'Discord OAuth Login',     desc: 'Sign in with Discord to access the dashboard.',                                      quarter: 'Q2 2026' },
  { status: 'in-progress', title: 'Live Dashboard (WebSocket)', desc: 'Real-time updates — member online status, task changes, and raids update without refresh.', pro: true, quarter: 'Q3 2026' },
  { status: 'in-progress', title: 'Mobile App',              desc: 'iOS and Android companion app with push notifications for raids, tasks, and alerts.', pro: true,  quarter: 'Q3 2026' },
  { status: 'planned',     title: 'Custom Scoring Formulas', desc: 'Let leaders define their own leaderboard scoring weights via the dashboard.',        quarter: 'Q3 2026' },
  { status: 'planned',     title: 'Wipe Report',             desc: 'Auto-generated end-of-wipe summary post with stats, top performers, and raid history.', quarter: 'Q3 2026' },
  { status: 'planned',     title: 'Map Integration',         desc: 'Display intel notes pinned on an interactive Rust map in the dashboard.',            pro: true,  quarter: 'Q4 2026' },
  { status: 'planned',     title: 'Multi-Server Support',    desc: 'Manage multiple Rust servers from a single clan dashboard.',                         pro: true,  quarter: 'Q4 2026' },
  { status: 'considering', title: 'Clan-to-Clan Challenges', desc: 'Structured PvP challenges between clans with tracked outcomes.',                    quarter: '2027' },
  { status: 'considering', title: 'AI Task Suggestions',     desc: 'AI-powered task recommendations based on wipe progress and enemy activity.',         pro: true,  quarter: '2027' },
  { status: 'considering', title: 'Recruitment Page',        desc: 'Public clan profile page for recruiting new members.',                               quarter: '2027' },
]

const statusConfig: Record<Status, { label: string; icon: typeof Check; color: string; dot: string }> = {
  'shipped':     { label: 'Shipped',     icon: Check,   color: 'text-green-400',  dot: 'bg-green-400' },
  'in-progress': { label: 'In Progress', icon: Clock,   color: 'text-blue-400',   dot: 'bg-blue-400 animate-pulse' },
  'planned':     { label: 'Planned',     icon: Circle,  color: 'text-gray-400',   dot: 'bg-gray-500' },
  'considering': { label: 'Considering', icon: Circle,  color: 'text-gray-600',   dot: 'bg-gray-700' },
}

const statusOrder: Status[] = ['in-progress', 'planned', 'shipped', 'considering']

export default function RoadmapPage() {
  const grouped = statusOrder.map(s => ({
    status: s,
    items: items.filter(i => i.status === s),
  })).filter(g => g.items.length > 0)

  return (
    <div className="min-h-screen bg-dark-800 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="section-label mb-3">What&apos;s coming</div>
          <h1 className="text-4xl font-black text-white mb-4">Roadmap</h1>
          <p className="text-gray-400 mb-12 max-w-xl">
            A rough view of what we are building. Priorities shift based on user feedback —
            Pro subscribers get early access and a direct vote on what ships next.
          </p>

          <div className="space-y-10">
            {grouped.map(({ status, items: groupItems }) => {
              const cfg = statusConfig[status]
              const Icon = cfg.icon
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                    <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-xs text-gray-700">({groupItems.length})</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groupItems.map(item => (
                      <div key={item.title} className={`card border-dark-400 ${status === 'shipped' ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-white">{item.title}</span>
                            {item.pro && (
                              <span className="badge bg-purple-500/15 text-purple-400 border border-purple-500/25 text-[9px]">
                                <Crown size={8} />Pro
                              </span>
                            )}
                          </div>
                          {item.quarter && (
                            <span className="text-[10px] text-gray-700 shrink-0">{item.quarter}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-12 rounded-xl border border-rust-500/25 bg-rust-500/5 p-6 text-center">
            <h3 className="font-bold text-white mb-2">Have a feature idea?</h3>
            <p className="text-sm text-gray-400 mb-4">
              Pro subscribers can vote on roadmap items and submit feature requests directly.
            </p>
            <a href="https://discord.gg/placeholder" target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
              Join our Discord to give feedback
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
