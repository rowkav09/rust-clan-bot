'use client'

import { Plus, MapPin, Users, Clock, Check, X, HelpCircle } from 'lucide-react'
import { mockRaids, mockMembers } from '@/lib/mock-data'

const memberName = (id: string) => mockMembers.find(m => m.id === id)?.username ?? id

export default function RaidsPage() {
  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white">Raids</h1>
          <p className="text-sm text-gray-500 mt-0.5">{mockRaids.length} scheduled</p>
        </div>
        <button className="btn-primary text-sm">
          <Plus size={15} />
          Schedule Raid
        </button>
      </div>

      <div className="space-y-4">
        {mockRaids.map(raid => {
          const totalRSVP = raid.rsvps.in.length + raid.rsvps.maybe.length + raid.rsvps.out.length
          const pct = (raid.rsvps.in.length / raid.maxMembers) * 100
          return (
            <div key={raid.id} className="card border-dark-400 hover:border-dark-300 transition-all">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-white">{raid.name}</h2>
                  <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5"><MapPin size={12} />{raid.target}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={12} />Grid {raid.gridRef}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-white">
                    {new Date(raid.time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center justify-end gap-1 mt-0.5">
                    <Clock size={11} />
                    {new Date(raid.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* RSVP bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>{raid.rsvps.in.length}/{raid.maxMembers} confirmed</span>
                  <span>{totalRSVP} responded</span>
                </div>
                <div className="h-1.5 rounded-full bg-dark-400 overflow-hidden">
                  <div
                    className="h-full bg-rust-gradient rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* RSVP groups */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-green-500/8 border border-green-500/20 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-green-400 mb-2">
                    <Check size={12} />
                    In ({raid.rsvps.in.length})
                  </div>
                  <div className="space-y-1">
                    {raid.rsvps.in.map(id => (
                      <div key={id} className="text-xs text-gray-400">{memberName(id)}</div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-yellow-500/8 border border-yellow-500/20 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-yellow-400 mb-2">
                    <HelpCircle size={12} />
                    Maybe ({raid.rsvps.maybe.length})
                  </div>
                  <div className="space-y-1">
                    {raid.rsvps.maybe.map(id => (
                      <div key={id} className="text-xs text-gray-400">{memberName(id)}</div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-red-500/8 border border-red-500/20 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400 mb-2">
                    <X size={12} />
                    Out ({raid.rsvps.out.length})
                  </div>
                  <div className="space-y-1">
                    {raid.rsvps.out.map(id => (
                      <div key={id} className="text-xs text-gray-400">{memberName(id)}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {mockRaids.length === 0 && (
          <div className="text-center py-20 text-gray-600">
            <div className="text-sm">No raids scheduled</div>
          </div>
        )}
      </div>
    </div>
  )
}
