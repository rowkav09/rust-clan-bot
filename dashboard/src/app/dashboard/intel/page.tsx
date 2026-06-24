'use client'

import { Plus, MapPin, Home, Target, Sword } from 'lucide-react'
import { mockIntel } from '@/lib/mock-data'
import { mockMembers } from '@/lib/mock-data'

const typeConfig = {
  enemy_base:    { label: 'Enemy Base',    icon: Target,  color: 'bg-red-500/15 text-red-400 border-red-500/25' },
  resource_node: { label: 'Resource Node', icon: MapPin,  color: 'bg-green-500/15 text-green-400 border-green-500/25' },
  safe_house:    { label: 'Safe House',    icon: Home,    color: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  intel:         { label: 'Intel',         icon: Sword,   color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
  other:         { label: 'Other',         icon: MapPin,  color: 'bg-gray-500/15 text-gray-400 border-gray-500/25' },
}

const memberName = (id: string) => mockMembers.find(m => m.id === id)?.username ?? 'Unknown'

export default function IntelPage() {
  const groups = Object.entries(typeConfig).map(([key, cfg]) => ({
    key,
    cfg,
    notes: mockIntel.filter(n => n.type === key),
  })).filter(g => g.notes.length > 0)

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white">Intel</h1>
          <p className="text-sm text-gray-500 mt-0.5">{mockIntel.length} notes · current wipe</p>
        </div>
        <button className="btn-primary text-sm">
          <Plus size={15} />
          Add Note
        </button>
      </div>

      <div className="space-y-8">
        {groups.map(({ key, cfg, notes }) => {
          const Icon = cfg.icon
          return (
            <div key={key}>
              <div className="flex items-center gap-2 mb-4">
                <Icon size={15} className={cfg.color.split(' ')[1]} />
                <span className="text-sm font-semibold text-white">{cfg.label}</span>
                <span className="text-xs text-gray-600">({notes.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {notes.map(note => {
                  const Icon2 = typeConfig[note.type]?.icon ?? MapPin
                  const color = typeConfig[note.type]?.color ?? typeConfig.other.color
                  return (
                    <div key={note.id} className="card border-dark-400 hover:border-dark-300 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-semibold text-white text-sm group-hover:text-rust-300 transition-colors">{note.title}</h3>
                        <span className={`badge shrink-0 ${color}`}>
                          <Icon2 size={9} />
                          {note.gridRef}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-3">{note.content}</p>
                      <div className="flex items-center justify-between text-[10px] text-gray-700">
                        <span>by {memberName(note.addedBy)}</span>
                        <span>{new Date(note.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
