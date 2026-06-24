'use client'

import { useState } from 'react'
import { Search, Filter, UserPlus, AlertTriangle, TrendingUp, Clock, Swords, CheckSquare, Wifi } from 'lucide-react'
import { mockMembers } from '@/lib/mock-data'
import { tierLabel, tierColor, formatHours } from '@/lib/utils'
import Link from 'next/link'

const TIERS = ['All', 'Leader', 'Officer', 'Member', 'Recruit']

export default function MembersPage() {
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('All')

  const filtered = mockMembers.filter(m => {
    const matchSearch = m.username.toLowerCase().includes(search.toLowerCase()) ||
      m.ingameName.toLowerCase().includes(search.toLowerCase())
    const matchTier = tierFilter === 'All' || tierLabel(m.tier) === tierFilter
    return matchSearch && matchTier
  })

  const online = mockMembers.filter(m => m.online).length

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white">Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">{mockMembers.length} total · {online} online</p>
        </div>
        <button className="btn-primary text-sm">
          <UserPlus size={15} />
          Add Member
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Leaders',  count: mockMembers.filter(m => m.tier === 3).length, color: 'text-yellow-400' },
          { label: 'Officers', count: mockMembers.filter(m => m.tier === 2).length, color: 'text-blue-400' },
          { label: 'Members',  count: mockMembers.filter(m => m.tier === 1).length, color: 'text-green-400' },
          { label: 'Recruits', count: mockMembers.filter(m => m.tier === 0).length, color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="card border-dark-400 text-center py-3">
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            className="input pl-9"
            placeholder="Search by username or in-game name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {TIERS.map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                tierFilter === t
                  ? 'bg-rust-500/20 border-rust-500/40 text-rust-400'
                  : 'bg-dark-600 border-dark-300 text-gray-500 hover:text-gray-300 hover:border-dark-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Members table */}
      <div className="rounded-xl border border-dark-400 overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-0 bg-dark-600 border-b border-dark-400 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div>Member</div>
          <div className="text-center">Tier</div>
          <div className="text-center flex items-center justify-center gap-1"><Clock size={11} />Hours</div>
          <div className="text-center flex items-center justify-center gap-1"><Swords size={11} />Raids</div>
          <div className="text-center flex items-center justify-center gap-1"><CheckSquare size={11} />Tasks</div>
          <div className="text-center flex items-center justify-center gap-1"><AlertTriangle size={11} />Warns</div>
          <div className="text-center">Last Seen</div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">No members match your filters.</div>
        ) : (
          filtered.map((m, i) => (
            <div
              key={m.id}
              className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-0 px-4 py-3.5 text-sm border-b border-dark-400/50 hover:bg-dark-500/40 transition-colors cursor-pointer ${
                i % 2 === 0 ? 'bg-dark-700/50' : 'bg-dark-600'
              }`}
            >
              {/* Member */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-dark-500 border border-dark-300 flex items-center justify-center text-xs font-bold text-gray-400">
                    {m.username.charAt(0).toUpperCase()}
                  </div>
                  {m.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-dark-600" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-white">{m.username}</div>
                  <div className="text-xs text-gray-600">{m.ingameName}</div>
                </div>
              </div>

              {/* Tier */}
              <div className="flex items-center justify-center">
                <span className={`badge ${tierColor(m.tier)}`}>{tierLabel(m.tier)}</span>
              </div>

              {/* Hours */}
              <div className="flex flex-col items-center justify-center">
                <div className="font-semibold text-white">{m.currentWipeHours}h</div>
                <div className="text-xs text-gray-600">{m.totalHours}h total</div>
              </div>

              {/* Raids */}
              <div className="flex flex-col items-center justify-center">
                <div className="font-semibold text-white">{m.wipeRaids}</div>
                <div className="text-xs text-gray-600">{m.totalRaids} total</div>
              </div>

              {/* Tasks */}
              <div className="flex flex-col items-center justify-center">
                <div className="font-semibold text-white">{m.currentWipeTasks}</div>
                <div className="text-xs text-gray-600">{m.tasksCompleted} done</div>
              </div>

              {/* Warnings */}
              <div className="flex items-center justify-center">
                {m.warnings > 0 ? (
                  <span className="badge bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
                    <AlertTriangle size={10} />
                    {m.warnings}
                  </span>
                ) : (
                  <span className="text-gray-700 text-xs">—</span>
                )}
              </div>

              {/* Last seen */}
              <div className="flex items-center justify-center">
                {m.online ? (
                  <div className="flex items-center gap-1.5 text-xs text-green-400">
                    <Wifi size={11} />
                    Online
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">{m.lastSeen}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 text-xs text-gray-600 text-center">
        Showing {filtered.length} of {mockMembers.length} members
      </div>
    </div>
  )
}
