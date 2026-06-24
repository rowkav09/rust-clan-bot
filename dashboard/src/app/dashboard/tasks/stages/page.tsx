'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus, Trash2, ChevronLeft, ChevronUp, ChevronDown, Save,
  Crown, Radio, Bot, Check, Edit2, X, Zap, Info,
} from 'lucide-react'
import {
  mockStages, mockStageConfig, STAGE_COLORS, SPECIALIST_LABELS,
  stageColorBadge, stageColorRing,
  type Stage, type StageTaskTemplate, type SpecialistRole,
  type TaskPriority, type TaskCategory, SPECIALIST_COLORS,
} from '@/lib/mock-data'
import { categoryIcon, priorityColor } from '@/lib/utils'

const ROLES: SpecialistRole[] = ['farm', 'pvp', 'build', 'scout', 'defend']
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high']

let nextId = 100

function uid() { return `st${nextId++}` }

function TemplateRow({
  tpl,
  onUpdate,
  onDelete,
}: {
  tpl: StageTaskTemplate
  onUpdate: (t: StageTaskTemplate) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(tpl)

  function save() { onUpdate(draft); setEditing(false) }
  function cancel() { setDraft(tpl); setEditing(false) }

  if (!editing) {
    return (
      <div className="flex items-start gap-3 p-3 rounded-lg bg-dark-700 border border-dark-400 group">
        <span className="text-base mt-0.5">{categoryIcon(tpl.category)}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white">{tpl.title}</div>
          <div className="text-xs text-gray-600 mt-0.5 line-clamp-1">{tpl.description}</div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`badge border border-transparent text-[10px] ${priorityColor(tpl.priority)}`}>{tpl.priority}</span>
            <span className={`badge border text-[10px] ${SPECIALIST_COLORS[tpl.role]}`}>{SPECIALIST_LABELS[tpl.role]}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-dark-500 text-gray-500 hover:text-white transition-colors">
            <Edit2 size={13} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/15 text-gray-500 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 rounded-lg bg-dark-600 border border-rust-500/30 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-600 mb-1 block">Role</label>
          <select className="input text-xs py-1.5"
            value={draft.role}
            onChange={e => setDraft(d => ({ ...d, role: e.target.value as SpecialistRole, category: e.target.value as TaskCategory }))}>
            {ROLES.map(r => <option key={r} value={r}>{SPECIALIST_LABELS[r]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-600 mb-1 block">Priority</label>
          <select className="input text-xs py-1.5"
            value={draft.priority}
            onChange={e => setDraft(d => ({ ...d, priority: e.target.value as TaskPriority }))}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-[10px] text-gray-600 mb-1 block">Task title</label>
        <input className="input text-xs py-1.5" value={draft.title}
          onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="e.g. Farm sulfur at D8" />
      </div>
      <div>
        <label className="text-[10px] text-gray-600 mb-1 block">Description (shown in Discord)</label>
        <input className="input text-xs py-1.5" value={draft.description}
          onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="What should they actually do?" />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={cancel} className="btn-ghost text-xs py-1.5 px-3"><X size={12} />Cancel</button>
        <button onClick={save} className="btn-primary text-xs py-1.5 px-3"><Check size={12} />Save</button>
      </div>
    </div>
  )
}

function StageEditor({
  stage,
  isActive,
  onUpdate,
  onSetActive,
  onDelete,
}: {
  stage: Stage
  isActive: boolean
  onUpdate: (s: Stage) => void
  onSetActive: () => void
  onDelete: () => void
}) {
  function updateTemplate(id: string, tpl: StageTaskTemplate) {
    onUpdate({ ...stage, taskTemplates: stage.taskTemplates.map(t => t.id === id ? tpl : t) })
  }
  function deleteTemplate(id: string) {
    onUpdate({ ...stage, taskTemplates: stage.taskTemplates.filter(t => t.id !== id) })
  }
  function addTemplate(role: SpecialistRole) {
    const tpl: StageTaskTemplate = {
      id: uid(),
      role,
      title: '',
      description: '',
      priority: 'medium',
      category: role as TaskCategory,
    }
    onUpdate({ ...stage, taskTemplates: [...stage.taskTemplates, tpl] })
  }

  const byRole = (role: SpecialistRole) => stage.taskTemplates.filter(t => t.role === role)

  return (
    <div className="flex-1 min-w-0 space-y-5">
      {/* Stage meta */}
      <div className="card border-dark-400">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Stage details</h3>
          <div className="flex items-center gap-2">
            {isActive && (
              <span className="badge bg-green-500/15 text-green-400 border border-green-500/25">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Active
              </span>
            )}
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Stage name</label>
            <input className="input" value={stage.name}
              onChange={e => onUpdate({ ...stage, name: e.target.value })} placeholder="e.g. Farming for Raid" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Description</label>
            <input className="input" value={stage.description}
              onChange={e => onUpdate({ ...stage, description: e.target.value })} placeholder="What is the clan doing in this stage?" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Colour</label>
            <div className="flex gap-2 flex-wrap">
              {STAGE_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => onUpdate({ ...stage, color: c.value })}
                  className={`w-8 h-8 rounded-lg ${c.ring} flex items-center justify-center transition-all ${
                    stage.color === c.value ? 'ring-2 ring-white/40 scale-110' : 'opacity-50 hover:opacity-80'
                  }`}
                  title={c.label}
                >
                  {stage.color === c.value && <Check size={14} className="text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!isActive && (
          <button onClick={onSetActive} className="btn-primary w-full justify-center mt-4 text-sm">
            <Zap size={14} />
            Set as Active Stage
          </button>
        )}
      </div>

      {/* Task templates per role */}
      <div className="card border-dark-400">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-white">Auto-assign templates</h3>
          <span className="badge bg-purple-500/15 text-purple-400 border border-purple-500/25 text-[10px]">
            <Crown size={9} />
            Pro · Rust+ triggered
          </span>
        </div>
        <p className="text-xs text-gray-600 mb-5 leading-relaxed">
          When a member joins the Rust server and their specialist role matches a template below,
          that task is automatically created and assigned to them in Discord.
        </p>

        <div className="space-y-5">
          {ROLES.map(role => {
            const templates = byRole(role)
            return (
              <div key={role}>
                <div className={`flex items-center justify-between mb-2`}>
                  <div className={`flex items-center gap-2 badge border ${SPECIALIST_COLORS[role]} text-xs`}>
                    {categoryIcon(role as string)} {SPECIALIST_LABELS[role]}
                    <span className="text-[10px] opacity-70">({templates.length})</span>
                  </div>
                  <button
                    onClick={() => addTemplate(role)}
                    className="text-xs text-gray-500 hover:text-rust-400 transition-colors flex items-center gap-1"
                  >
                    <Plus size={11} />
                    Add task
                  </button>
                </div>

                <div className="space-y-2 pl-2">
                  {templates.map(tpl => (
                    <TemplateRow
                      key={tpl.id}
                      tpl={tpl}
                      onUpdate={updated => updateTemplate(tpl.id, updated)}
                      onDelete={() => deleteTemplate(tpl.id)}
                    />
                  ))}
                  {templates.length === 0 && (
                    <button
                      onClick={() => addTemplate(role)}
                      className="w-full text-xs text-gray-700 border border-dashed border-dark-300 rounded-lg py-3 hover:border-dark-200 hover:text-gray-500 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus size={12} />
                      No template — click to add one
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function StagesPage() {
  const [stages, setStages] = useState<Stage[]>(mockStages)
  const [config, setConfig] = useState(mockStageConfig)
  const [selectedId, setSelectedId] = useState<string>(mockStages[0]?.id ?? '')
  const [saved, setSaved] = useState(false)

  const selected = stages.find(s => s.id === selectedId)

  function updateStage(updated: Stage) {
    setStages(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  function addStage() {
    const id = `s${Date.now()}`
    const newStage: Stage = {
      id,
      name: 'New Stage',
      description: '',
      color: 'blue',
      order: stages.length + 1,
      taskTemplates: [],
    }
    setStages(prev => [...prev, newStage])
    setSelectedId(id)
  }

  function deleteStage(id: string) {
    const remaining = stages.filter(s => s.id !== id)
    setStages(remaining)
    if (config.activeStageId === id) setConfig(c => ({ ...c, activeStageId: remaining[0]?.id ?? null }))
    setSelectedId(remaining[0]?.id ?? '')
  }

  function moveStage(id: string, dir: 'up' | 'down') {
    setStages(prev => {
      const idx = prev.findIndex(s => s.id === id)
      if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === prev.length - 1)) return prev
      const next = [...prev]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/tasks" className="p-1.5 rounded-lg hover:bg-dark-500 text-gray-500 hover:text-white transition-colors">
          <ChevronLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Stage Manager</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure wipe stages and the tasks that auto-assign when members come online
          </p>
        </div>
        <button onClick={handleSave} className="btn-primary text-sm">
          {saved ? <><Check size={14} />Saved!</> : <><Save size={14} />Save All</>}
        </button>
      </div>

      {/* Global settings bar */}
      <div className="card border-dark-400 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Bot size={14} className="text-purple-400" />
              <span className="text-sm font-semibold text-white">Auto-assignment</span>
              <span className="badge bg-purple-500/15 text-purple-400 border border-purple-500/25 text-[10px]">
                <Crown size={8} />
                Pro
              </span>
            </div>
            <p className="text-xs text-gray-500">
              When enabled, members who join the Rust server have tasks auto-assigned based on the active stage and their specialist role.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {/* Rust+ connected indicator */}
            <div className="flex flex-col items-end gap-1">
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${config.rustplusConnected ? 'text-green-400' : 'text-red-400'}`}>
                <Radio size={12} />
                Rust+ {config.rustplusConnected ? 'Connected' : 'Disconnected'}
              </div>
              {!config.rustplusConnected && (
                <span className="text-[10px] text-gray-600">Required for online triggers</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  { key: 'autoAssignEnabled', label: 'Auto-assign tasks' },
                  { key: 'notifyOnAssign',    label: 'Notify member in Discord' },
                ] as { key: keyof typeof config; label: string }[]
              ).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                  <button
                    onClick={() => setConfig(c => ({ ...c, [key]: !c[key] }))}
                    className={`relative w-8 h-4 rounded-full transition-colors ${config[key] ? 'bg-purple-500' : 'bg-dark-400'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${config[key] ? 'translate-x-4' : ''}`} />
                  </button>
                  <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How it works info box */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 mb-6 flex items-start gap-3">
        <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-gray-400 leading-relaxed">
          <span className="text-blue-300 font-semibold">How stages work:</span>{' '}
          Set one stage as active. When a member joins the server (detected via Rust+), the bot looks up their
          specialist role, finds matching templates in the active stage, and automatically creates + assigns those
          tasks to them. Members see the task in Discord — no commands needed.
          Members without a specialist role receive no auto-assigned tasks.
        </div>
      </div>

      <div className="flex gap-5 items-start">
        {/* Stage list */}
        <div className="w-56 shrink-0 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">
            Stages ({stages.length})
          </div>
          {stages.map((stage, idx) => (
            <div
              key={stage.id}
              onClick={() => setSelectedId(stage.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all group ${
                selectedId === stage.id
                  ? 'border-dark-200 bg-dark-500'
                  : 'border-dark-400 bg-dark-600 hover:border-dark-300 hover:bg-dark-500'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${stageColorRing(stage.color)}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{stage.name}</div>
                <div className="text-[10px] text-gray-600">{stage.taskTemplates.length} templates</div>
              </div>
              <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e => { e.stopPropagation(); moveStage(stage.id, 'up') }}
                  className="p-0.5 hover:text-white text-gray-600"><ChevronUp size={11} /></button>
                <button onClick={e => { e.stopPropagation(); moveStage(stage.id, 'down') }}
                  className="p-0.5 hover:text-white text-gray-600"><ChevronDown size={11} /></button>
              </div>
              {config.activeStageId === stage.id && (
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 animate-pulse" />
              )}
            </div>
          ))}

          <button
            onClick={addStage}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-dark-300 text-xs text-gray-600 hover:text-gray-400 hover:border-dark-200 transition-all"
          >
            <Plus size={13} />
            New Stage
          </button>
        </div>

        {/* Editor */}
        {selected ? (
          <StageEditor
            stage={selected}
            isActive={config.activeStageId === selected.id}
            onUpdate={updateStage}
            onSetActive={() => setConfig(c => ({ ...c, activeStageId: selected.id }))}
            onDelete={() => deleteStage(selected.id)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center py-20 text-gray-700 text-sm">
            Select a stage to edit, or create a new one.
          </div>
        )}
      </div>
    </div>
  )
}
