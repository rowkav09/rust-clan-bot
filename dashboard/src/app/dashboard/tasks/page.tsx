'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Clock, User, Flag, Crown, Zap, Wifi, ChevronRight, Bot, Radio } from 'lucide-react'
import {
  mockTasks, mockMembers, mockStages, mockStageConfig,
  stageColorBadge, stageColorRing, SPECIALIST_COLORS, SPECIALIST_LABELS,
} from '@/lib/mock-data'
import { priorityColor, statusColor, categoryIcon } from '@/lib/utils'

type StatusFilter = 'all' | 'pending' | 'in-progress' | 'completed'

const memberName = (id: string) => mockMembers.find(m => m.id === id)?.username ?? 'Unknown'

function TaskCard({ task }: { task: typeof mockTasks[0] }) {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed'

  return (
    <div className={`card border-dark-400 hover:border-dark-300 transition-all cursor-pointer ${isOverdue ? 'border-red-500/30' : ''}`}>
      {task.autoAssigned && (
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-purple-400 mb-2">
          <Bot size={10} />
          Auto-assigned · Stage trigger
        </div>
      )}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-xl mt-0.5">{categoryIcon(task.category)}</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm leading-snug">{task.title}</div>
          <div className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`badge border border-transparent ${priorityColor(task.priority)}`}><Flag size={9} />{task.priority}</span>
        <span className={`badge border border-transparent ${statusColor(task.status)}`}>{task.status}</span>
        <span className="badge bg-dark-400 text-gray-500 border border-transparent capitalize">{task.category}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <User size={11} />
          {task.assignedTo.map(id => memberName(id)).join(', ')}
        </div>
        {task.deadline && (
          <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-gray-600'}`}>
            <Clock size={11} />
            {isOverdue ? 'Overdue' : new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [catFilter, setCatFilter] = useState('all')
  const [config, setConfig] = useState(mockStageConfig)

  const activeStage = mockStages.find(s => s.id === config.activeStageId)
  const categories = ['all', ...Array.from(new Set(mockTasks.map(t => t.category)))]

  const filtered = mockTasks.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    const matchCat = catFilter === 'all' || t.category === catFilter
    return matchStatus && matchCat
  })

  const counts = {
    pending:      mockTasks.filter(t => t.status === 'pending').length,
    'in-progress':mockTasks.filter(t => t.status === 'in-progress').length,
    completed:    mockTasks.filter(t => t.status === 'completed').length,
  }

  const columns: { status: StatusFilter; label: string; color: string }[] = [
    { status: 'pending',     label: 'Pending',     color: 'text-yellow-400 border-yellow-500/30' },
    { status: 'in-progress', label: 'In Progress', color: 'text-blue-400 border-blue-500/30' },
    { status: 'completed',   label: 'Completed',   color: 'text-green-400 border-green-500/30' },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">{mockTasks.length} total · {counts.pending} pending · {counts['in-progress']} active</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/tasks/stages" className="btn-secondary text-sm">
            <Zap size={14} />
            Manage Stages
          </Link>
          <button className="btn-primary text-sm">
            <Plus size={15} />
            New Task
          </button>
        </div>
      </div>

      {/* Stage + auto-assign status bar (Pro) */}
      <div className="rounded-xl border border-dark-300 bg-dark-600 p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          {activeStage ? (
            <>
              <div className={`w-3 h-3 rounded-full shrink-0 ${stageColorRing(activeStage.color)}`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Active Stage: {activeStage.name}</span>
                  <span className={`badge border ${stageColorBadge(activeStage.color)} text-[10px]`}>
                    {activeStage.taskTemplates.length} templates
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{activeStage.description}</p>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500">No stage active — auto-assign is paused</div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Rust+ status */}
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${config.rustplusConnected ? 'text-green-400' : 'text-gray-600'}`}>
            <Radio size={12} />
            Rust+ {config.rustplusConnected ? 'Connected' : 'Offline'}
          </div>

          {/* Auto-assign toggle */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-500 border border-dark-300">
            <Bot size={13} className={config.autoAssignEnabled ? 'text-purple-400' : 'text-gray-600'} />
            <span className="text-xs font-medium text-gray-300">Auto-assign</span>
            <button
              onClick={() => setConfig(c => ({ ...c, autoAssignEnabled: !c.autoAssignEnabled }))}
              className={`relative w-8 h-4 rounded-full transition-colors ${config.autoAssignEnabled ? 'bg-purple-500' : 'bg-dark-400'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${config.autoAssignEnabled ? 'translate-x-4' : ''}`} />
            </button>
            <span className={`badge text-[10px] ${config.autoAssignEnabled ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' : 'bg-dark-400 text-gray-600 border border-dark-300'}`}>
              <Crown size={8} />
              Pro
            </span>
          </div>

          <Link href="/dashboard/tasks/stages" className="text-xs text-rust-400 hover:text-rust-300 transition-colors flex items-center gap-1">
            Configure stages <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      {/* How auto-assign works callout (when enabled) */}
      {config.autoAssignEnabled && activeStage && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3 mb-5 flex items-start gap-3">
          <Bot size={14} className="text-purple-400 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-400 leading-relaxed">
            <span className="text-purple-300 font-semibold">Auto-assign is active.</span>{' '}
            When a member joins the Rust server, their specialist role is matched against the{' '}
            <span className="text-white font-medium">{activeStage.name}</span> stage templates and a task is automatically
            created and assigned to them in Discord.
          </div>
        </div>
      )}

      {/* Role breakdown for current stage */}
      {activeStage && (
        <div className="mb-5">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">
            Templates in current stage by role
          </div>
          <div className="flex flex-wrap gap-2">
            {(['farm','pvp','build','scout','defend'] as const).map(role => {
              const count = activeStage.taskTemplates.filter(t => t.role === role).length
              if (count === 0) return null
              return (
                <div key={role} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${SPECIALIST_COLORS[role]}`}>
                  {categoryIcon(role)} {SPECIALIST_LABELS[role]} · {count} task{count !== 1 ? 's' : ''}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex gap-1 rounded-lg border border-dark-300 bg-dark-600 p-0.5">
          {(['all', 'pending', 'in-progress', 'completed'] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize ${
                statusFilter === s ? 'bg-dark-400 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}>
              {s === 'all' ? `All (${mockTasks.length})` : `${s} (${counts[s as keyof typeof counts] ?? 0})`}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg border border-dark-300 bg-dark-600 p-0.5">
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize ${
                catFilter === c ? 'bg-dark-400 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}>
              {c === 'all' ? 'All' : `${categoryIcon(c)} ${c}`}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {columns.map(col => {
          const tasks = filtered.filter(t => t.status === col.status)
          return (
            <div key={col.status}>
              <div className={`flex items-center gap-2 mb-3 pb-3 border-b ${col.color}`}>
                <span className={`text-sm font-semibold ${col.color.split(' ')[0]}`}>{col.label}</span>
                <span className="text-xs font-bold bg-dark-500 text-gray-500 px-2 py-0.5 rounded-full">{tasks.length}</span>
              </div>
              <div className="space-y-3">
                {tasks.map(t => <TaskCard key={t.id} task={t} />)}
                {tasks.length === 0 && (
                  <div className="text-center text-sm text-gray-700 py-8 rounded-xl border border-dashed border-dark-300">
                    No {col.label.toLowerCase()} tasks
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
