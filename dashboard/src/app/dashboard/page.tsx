'use client'

import Link from 'next/link'
import {
  Users, Clock, Swords, TrendingUp, Wifi, Server, ChevronRight,
  AlertTriangle, CheckSquare, UserPlus, Calendar, Crown, Trophy
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, LineChart, Line
} from 'recharts'
import { mockMembers, mockWipe, mockActivityChart, mockPopHistory, mockApplications, mockRaids } from '@/lib/mock-data'
import { tierLabel, tierColor, formatHours } from '@/lib/utils'

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string
}) {
  return (
    <div className="card border-dark-400 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-0.5">{label}</div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
      </div>
    </div>
  )
}

const onlineMembers = mockMembers.filter(m => m.online)
const totalWipeHours = mockMembers.reduce((s, m) => s + m.currentWipeHours, 0)
const totalRaids = mockMembers[0]?.wipeRaids ?? 0
const topMembers = [...mockMembers].sort((a, b) => b.currentWipeHours - a.currentWipeHours).slice(0, 5)

export default function DashboardOverview() {
  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Wipe #{mockWipe.wipeNumber} · {mockWipe.serverName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/25 text-green-400 text-xs font-semibold">
            <Wifi size={11} className="animate-pulse" />
            Bot Online
          </div>
          <Link href="/pricing" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rust-500/10 border border-rust-500/25 text-rust-400 text-xs font-semibold hover:bg-rust-500/20 transition-colors">
            <Crown size={11} />
            Pro Trial: 9 days left
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users}     label="Total Members"     value={String(mockMembers.length)} sub={`${onlineMembers.length} online now`}           color="bg-blue-500/15 text-blue-400" />
        <StatCard icon={Clock}     label="Wipe Hours"        value={formatHours(totalWipeHours)}  sub="across all members"                            color="bg-rust-500/15 text-rust-400" />
        <StatCard icon={Swords}    label="Wipe Raids"        value="12"                            sub="3 more planned"                               color="bg-red-500/15 text-red-400" />
        <StatCard icon={TrendingUp}label="Active This Wipe"  value="18"                            sub={`of ${mockMembers.length} members`}            color="bg-green-500/15 text-green-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Activity chart */}
        <div className="lg:col-span-2 card border-dark-400">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="font-semibold text-white text-sm">Member Activity</div>
              <div className="text-xs text-gray-500 mt-0.5">Hours played — last 7 days</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={mockActivityChart}>
              <defs>
                <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e8622a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e8622a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: '#4f546a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4f546a', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{ background: '#131519', border: '1px solid #1e2028', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#9ba3b0' }}
                itemStyle={{ color: '#e8622a' }}
              />
              <Area type="monotone" dataKey="hours" stroke="#e8622a" fill="url(#hoursGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Wipe info */}
        <div className="card border-dark-400 space-y-4">
          <div className="font-semibold text-white text-sm">Current Wipe</div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Server size={14} className="text-gray-600 shrink-0" />
              <span className="text-sm text-gray-300 truncate">{mockWipe.serverName}</span>
            </div>
            <div className="rounded-xl bg-dark-500 border border-dark-300 p-4 text-center">
              <div className="text-3xl font-black text-white">{mockWipe.daysLeft}d {mockWipe.hoursLeft % 24}h</div>
              <div className="text-xs text-gray-500 mt-1">until wipe · {mockWipe.nextWipeType.toUpperCase()}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-dark-500 p-2.5">
                <div className="text-gray-600 mb-1">Players</div>
                <div className="font-semibold text-white">{mockWipe.currentPlayers}/{mockWipe.maxPlayers}</div>
              </div>
              <div className="rounded-lg bg-dark-500 p-2.5">
                <div className="text-gray-600 mb-1">Map Size</div>
                <div className="font-semibold text-white">{mockWipe.mapSize}</div>
              </div>
            </div>
            <div className="text-xs text-gray-600 font-mono bg-dark-500 px-3 py-2 rounded-lg">
              {mockWipe.connect}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Top members */}
        <div className="card border-dark-400">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-white text-sm">Top Members</div>
            <Link href="/dashboard/leaderboard" className="text-xs text-rust-400 hover:text-rust-300 transition-colors flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {topMembers.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3">
                <div className={`w-6 text-center text-xs font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-600'}`}>
                  {i + 1}
                </div>
                <div className="w-7 h-7 rounded-full bg-dark-500 border border-dark-300 flex items-center justify-center text-xs font-bold text-gray-400">
                  {m.username.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{m.username}</div>
                  <div className={`text-[10px] px-1 rounded ${tierColor(m.tier)} inline-flex`}>{tierLabel(m.tier)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{m.currentWipeHours}h</div>
                  <div className="text-[10px] text-gray-600">{m.wipeRaids} raids</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Online now */}
        <div className="card border-dark-400">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-white text-sm">Online Now</div>
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {onlineMembers.length} playing
            </div>
          </div>
          {onlineMembers.length === 0 ? (
            <div className="text-sm text-gray-600 text-center py-6">No members online</div>
          ) : (
            <div className="space-y-2">
              {onlineMembers.map(m => (
                <div key={m.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-dark-500">
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-dark-400 border border-dark-300 flex items-center justify-center text-xs font-bold text-gray-400">
                      {m.username.charAt(0)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-dark-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{m.username}</div>
                    <div className="text-[10px] text-gray-600">{m.ingameName}</div>
                  </div>
                  <div className="text-xs text-gray-600">{m.currentWipeHours}h</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions & alerts */}
        <div className="space-y-4">
          {/* Pending applications */}
          {mockApplications.length > 0 && (
            <div className="card border-yellow-500/20 bg-yellow-500/5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-yellow-400" />
                <span className="text-sm font-semibold text-yellow-400">Pending Applications</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">{mockApplications.length} application(s) awaiting review.</p>
              <Link href="/dashboard/applications" className="btn-secondary w-full justify-center text-xs py-2">
                Review Applications
              </Link>
            </div>
          )}

          {/* Next raid */}
          {mockRaids[0] && (
            <div className="card border-dark-400">
              <div className="flex items-center gap-2 mb-3">
                <Swords size={14} className="text-red-400" />
                <span className="text-sm font-semibold text-white">Next Raid</span>
              </div>
              <div className="text-sm font-medium text-white mb-1">{mockRaids[0].name}</div>
              <div className="text-xs text-gray-500 mb-1">Target: {mockRaids[0].target}</div>
              <div className="text-xs text-gray-500 mb-3">Grid {mockRaids[0].gridRef} · Tonight 9pm</div>
              <div className="flex gap-2 text-xs">
                <span className="flex items-center gap-1 text-green-400"><span className="w-2 h-2 rounded-full bg-green-400" />{mockRaids[0].rsvps.in.length} in</span>
                <span className="flex items-center gap-1 text-yellow-400"><span className="w-2 h-2 rounded-full bg-yellow-400" />{mockRaids[0].rsvps.maybe.length} maybe</span>
                <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-400" />{mockRaids[0].rsvps.out.length} out</span>
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="card border-dark-400 space-y-1">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Quick Links</div>
            {[
              { label: 'View Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
              { label: 'Manage Tasks', href: '/dashboard/tasks', icon: CheckSquare },
              { label: 'Add Member', href: '/dashboard/members', icon: UserPlus },
            ].map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-dark-500 text-sm text-gray-400 hover:text-white transition-all group">
                <Icon size={13} className="text-gray-600 group-hover:text-rust-400 transition-colors" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Server pop chart */}
      <div className="card border-dark-400">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="font-semibold text-white text-sm">Server Population — Today</div>
            <div className="text-xs text-gray-500 mt-0.5">{mockWipe.serverName}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full bg-rust-500" />
              Players online
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={mockPopHistory}>
            <XAxis dataKey="time" tick={{ fill: '#4f546a', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
            <YAxis tick={{ fill: '#4f546a', fontSize: 10 }} axisLine={false} tickLine={false} width={25} domain={[0, 200]} />
            <Tooltip
              contentStyle={{ background: '#131519', border: '1px solid #1e2028', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#9ba3b0' }}
              itemStyle={{ color: '#e8622a' }}
            />
            <Line type="monotone" dataKey="players" stroke="#e8622a" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Upgrade banner when near limits */}
      <div className="mt-4 rounded-xl border border-rust-500/25 bg-gradient-to-r from-rust-500/8 to-transparent p-4 flex items-center gap-4">
        <Crown size={18} className="text-rust-400 shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">You're on a Pro Trial — 9 days left</div>
          <div className="text-xs text-gray-500 mt-0.5">Upgrade to keep Rust+ integration, intel tracking, and advanced automation.</div>
        </div>
        <Link href="/pricing" className="btn-primary text-xs px-4 py-2 shrink-0">
          Upgrade to Pro
        </Link>
      </div>
    </div>
  )
}
