import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatHours(h: number) {
  if (h >= 1000) return `${(h / 1000).toFixed(1)}k`
  return `${h}h`
}

export function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function tierLabel(tier: 0 | 1 | 2 | 3) {
  return ['Recruit', 'Member', 'Officer', 'Leader'][tier]
}

export function tierColor(tier: 0 | 1 | 2 | 3) {
  return [
    'bg-gray-500/15 text-gray-400 border border-gray-500/25',
    'bg-green-500/15 text-green-400 border border-green-500/25',
    'bg-blue-500/15 text-blue-400 border border-blue-500/25',
    'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
  ][tier]
}

export function priorityColor(p: 'low' | 'medium' | 'high') {
  return { low: 'bg-gray-500/15 text-gray-400', medium: 'bg-blue-500/15 text-blue-400', high: 'bg-red-500/15 text-red-400' }[p]
}

export function statusColor(s: 'pending' | 'in-progress' | 'completed') {
  return { pending: 'bg-yellow-500/15 text-yellow-400', 'in-progress': 'bg-blue-500/15 text-blue-400', completed: 'bg-green-500/15 text-green-400' }[s]
}

export function categoryIcon(c: string) {
  return { farm: '⛏️', pvp: '⚔️', build: '🏗️', scout: '🔭', defend: '🛡️', admin: '⚙️' }[c] ?? '📋'
}
