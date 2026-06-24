'use client'

import { useState } from 'react'
import { Plus, Filter, Clock, User, Flag } from 'lucide-react'
import { mockTasks, mockMembers } from '@/lib/mock-data'
import { priorityColor, statusColor, categoryIcon } from '@/lib/utils'

type StatusFilter = 'all' | 'pending' | 'in-progress' | 'completed'

const memberName = (id: string) => mockMembers.find(m => m.id === id)?.username ?? 'Unknown'

function TaskCard({ task }: { task: typeof mockTasks[0] }) {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed'

  return (
    <div className={`card border-dark-400 hover:border-dark-300 transition-all cursor-pointer ${isOverdue ? 'border-red-500/30' : ''}`}>
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

  const categories = ['all', ...Array.from(new Set(mockTasks.map(t => t.category)))]

  const filtered = mockTasks.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    const matchCat = catFilter === 'all' || t.category === catFilter
    return matchStatus && matchCat
  })

  const counts = {
    pending: mockTasks.filter(t => t.status === 'pending').length,
    'in-progress': mockTasks.filter(t => t.status === 'in-progress').length,
    completed: mockTasks.filter(t => t.status === 'completed').length,
  }

  const columns: { status: StatusFilter; label: string; color: string }[] = [
    { status: 'pending',     label: 'Pending',     color: 'text-yellow-400 border-yellow-500/30' },
    { status: 'in-progress', label: 'In Progress',  color: 'text-blue-400 border-blue-500/30' },
    { status: 'completed',   label: 'Completed',   color: 'text-green-400 border-green-500/30' },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">{mockTasks.length} total · {counts.pending} pending · {counts['in-progress']} active</p>
        </div>
        <button className="btn-primary text-sm">
          <Plus size={15} />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
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
