'use client'

import { useState } from 'react'
import { Check, X, Clock, User, Calendar, MessageSquare, Gamepad2 } from 'lucide-react'
import { mockApplications } from '@/lib/mock-data'

type App = typeof mockApplications[0]

function ApplicationCard({ app, onAction }: { app: App; onAction: (id: string, action: 'approved' | 'denied') => void }) {
  return (
    <div className="card border-dark-400 hover:border-dark-300 transition-all">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-dark-500 border border-dark-300 flex items-center justify-center text-sm font-bold text-gray-400">
            {app.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-white">{app.username}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Calendar size={10} />
              {new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
        <span className="badge bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
          <Clock size={10} />
          Pending
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-dark-500 p-3">
          <div className="text-xs text-gray-600 mb-1 flex items-center gap-1"><User size={10} />Age</div>
          <div className="text-sm font-semibold text-white">{app.age}</div>
        </div>
        <div className="rounded-lg bg-dark-500 p-3">
          <div className="text-xs text-gray-600 mb-1 flex items-center gap-1"><Gamepad2 size={10} />Rust Hours</div>
          <div className="text-sm font-semibold text-white">{app.steamHours.toLocaleString()}h</div>
        </div>
        <div className="col-span-2 rounded-lg bg-dark-500 p-3">
          <div className="text-xs text-gray-600 mb-1 flex items-center gap-1"><Clock size={10} />Availability</div>
          <div className="text-sm font-semibold text-white">{app.availability}</div>
        </div>
      </div>

      <div className="rounded-lg bg-dark-500 border border-dark-400 p-3 mb-4">
        <div className="text-xs text-gray-600 mb-2 flex items-center gap-1"><MessageSquare size={10} />Why do you want to join?</div>
        <div className="text-sm text-gray-300 leading-relaxed">"{app.whyJoin}"</div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onAction(app.id, 'approved')}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-semibold hover:bg-green-500/25 transition-colors"
        >
          <Check size={15} />
          Approve
        </button>
        <button
          onClick={() => onAction(app.id, 'denied')}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors"
        >
          <X size={15} />
          Deny
        </button>
      </div>
    </div>
  )
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState(mockApplications)
  const [reviewed, setReviewed] = useState<{ id: string; action: 'approved' | 'denied' }[]>([])

  function handleAction(id: string, action: 'approved' | 'denied') {
    setReviewed(r => [...r, { id, action }])
    setApps(a => a.filter(app => app.id !== id))
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white">Applications</h1>
          <p className="text-sm text-gray-500 mt-0.5">{apps.length} pending review</p>
        </div>
      </div>

      {apps.length === 0 && reviewed.length === 0 && (
        <div className="text-center py-20 text-gray-600">
          <User size={32} className="mx-auto mb-3 opacity-30" />
          <div className="text-sm">No pending applications</div>
        </div>
      )}

      {apps.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-4">Pending ({apps.length})</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {apps.map(app => (
              <ApplicationCard key={app.id} app={app} onAction={handleAction} />
            ))}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-4">Reviewed this session ({reviewed.length})</div>
          <div className="space-y-2">
            {reviewed.map(r => (
              <div key={r.id} className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm ${
                r.action === 'approved'
                  ? 'border-green-500/20 bg-green-500/5 text-green-400'
                  : 'border-red-500/20 bg-red-500/5 text-red-400'
              }`}>
                <span>Application #{r.id}</span>
                <span className="flex items-center gap-1.5 font-semibold capitalize">
                  {r.action === 'approved' ? <Check size={13} /> : <X size={13} />}
                  {r.action}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
