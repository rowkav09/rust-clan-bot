'use client'

import { useState } from 'react'
import { Trophy, Clock, Swords, CheckSquare, TrendingUp, Medal } from 'lucide-react'
import { mockMembers } from '@/lib/mock-data'
import { tierLabel, tierColor } from '@/lib/utils'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

type View = 'wipe' | 'alltime'

function calcScore(m: typeof mockMembers[0], view: View) {
  if (view === 'wipe') {
    return m.currentWipeHours * 10 + m.wipeRaids * 50 + m.currentWipeTasks * 25
  }
  return m.totalHours * 5 + m.totalRaids * 30 + m.tasksCompleted * 15
}

export default function LeaderboardPage() {
  const [view, setView] = useState<View>('wipe')

  const ranked = [...mockMembers]
    .map(m => ({ ...m, score: calcScore(m, view) }))
    .sort((a, b) => b.score - a.score)

  const medals = ['🥇', '🥈', '🥉']

  const chartData = ranked.slice(0, 8).map(m => ({
    name: m.username.length > 10 ? m.username.slice(0, 10) + '…' : m.username,
    score: m.score,
    hours: view === 'wipe' ? m.currentWipeHours : m.totalHours,
  }))

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ranked by score: hours × 10 + raids × 50 + tasks × 25</p>
        </div>
        <div className="flex rounded-lg border border-dark-300 bg-dark-600 overflow-hidden">
          {(['wipe', 'alltime'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                view === v ? 'bg-rust-500 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {v === 'wipe' ? 'This Wipe' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {ranked.slice(0, 3).map((m, i) => (
          <div
            key={m.id}
            className={`card text-center ${
              i === 0 ? 'border-yellow-500/40 bg-yellow-500/5' :
              i === 1 ? 'border-gray-400/30 bg-gray-500/5' :
              'border-amber-700/30 bg-amber-700/5'
            } relative overflow-hidden`}
          >
            <div className="text-3xl mb-2">{medals[i]}</div>
            <div className="w-12 h-12 rounded-full bg-dark-500 border-2 border-dark-300 mx-auto mb-3 flex items-center justify-center text-lg font-bold text-gray-400">
              {m.username.charAt(0)}
            </div>
            <div className="font-bold text-white text-sm mb-1">{m.username}</div>
            <span className={`badge ${tierColor(m.tier)} text-[10px] mb-3`}>{tierLabel(m.tier)}</span>
            <div className={`text-2xl font-black mb-1 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-amber-600'}`}>
              {m.score.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">points</div>
            <div className="grid grid-cols-3 gap-1 mt-4 text-xs">
              <div>
                <div className="text-white font-semibold">{view === 'wipe' ? m.currentWipeHours : m.totalHours}h</div>
                <div className="text-gray-600">hrs</div>
              </div>
              <div>
                <div className="text-white font-semibold">{view === 'wipe' ? m.wipeRaids : m.totalRaids}</div>
                <div className="text-gray-600">raids</div>
              </div>
              <div>
                <div className="text-white font-semibold">{view === 'wipe' ? m.currentWipeTasks : m.tasksCompleted}</div>
                <div className="text-gray-600">tasks</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card border-dark-400 mb-6">
        <div className="text-sm font-semibold text-white mb-5">Score comparison — Top 8</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barSize={28}>
            <XAxis dataKey="name" tick={{ fill: '#4f546a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#4f546a', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{ background: '#131519', border: '1px solid #1e2028', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#9ba3b0' }}
              cursor={{ fill: 'rgba(232,98,42,0.05)' }}
            />
            <Bar dataKey="score" fill="#e8622a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Full table */}
      <div className="rounded-xl border border-dark-400 overflow-hidden">
        <div className="grid grid-cols-[40px_2fr_1fr_1fr_1fr_1fr_1fr] bg-dark-600 border-b border-dark-400 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div>#</div>
          <div>Member</div>
          <div className="text-center">Score</div>
          <div className="text-center">Hours</div>
          <div className="text-center">Raids</div>
          <div className="text-center">Tasks</div>
          <div className="text-center">Tier</div>
        </div>
        {ranked.map((m, i) => (
          <div
            key={m.id}
            className={`grid grid-cols-[40px_2fr_1fr_1fr_1fr_1fr_1fr] px-4 py-3.5 text-sm border-b border-dark-400/50 ${
              i % 2 === 0 ? 'bg-dark-700/50' : 'bg-dark-600'
            } ${i < 3 ? 'opacity-100' : 'opacity-90'}`}
          >
            <div className={`font-bold text-sm flex items-center ${
              i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-600'
            }`}>
              {i < 3 ? medals[i] : i + 1}
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-dark-500 border border-dark-300 flex items-center justify-center text-xs font-bold text-gray-400">
                  {m.username.charAt(0)}
                </div>
                {m.online && <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border-2 border-dark-600" />}
              </div>
              <div>
                <div className="font-medium text-white">{m.username}</div>
                <div className="text-xs text-gray-600">{m.ingameName}</div>
              </div>
            </div>
            <div className="flex items-center justify-center font-bold text-white">{m.score.toLocaleString()}</div>
            <div className="flex items-center justify-center text-gray-300">
              {view === 'wipe' ? m.currentWipeHours : m.totalHours}h
            </div>
            <div className="flex items-center justify-center text-gray-300">
              {view === 'wipe' ? m.wipeRaids : m.totalRaids}
            </div>
            <div className="flex items-center justify-center text-gray-300">
              {view === 'wipe' ? m.currentWipeTasks : m.tasksCompleted}
            </div>
            <div className="flex items-center justify-center">
              <span className={`badge ${tierColor(m.tier)}`}>{tierLabel(m.tier)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
