'use client'

import { useState } from 'react'
import { Save, RefreshCw, Crown, ExternalLink, AlertTriangle, Check } from 'lucide-react'
import Link from 'next/link'

type Toggle = {
  key: string
  label: string
  desc: string
  defaultOn: boolean
  pro?: boolean
}

const automationToggles: Toggle[] = [
  { key: 'auto-promote',        label: 'Auto-promote Recruits',   desc: 'Automatically promote Recruits to Member when they hit thresholds', defaultOn: true },
  { key: 'auto-leaderboard',    label: 'Auto-leaderboard posting', desc: 'Post leaderboard to channel every 30 minutes', defaultOn: true },
  { key: 'wipe-countdown',      label: 'Wipe countdown rename',    desc: 'Rename wipe channel with live countdown', defaultOn: true },
  { key: 'daily-tasks',         label: 'Daily task generation',    desc: 'Auto-generate random daily tasks each morning', defaultOn: false, pro: true },
  { key: 'enemy-alerts',        label: 'Enemy online alerts',      desc: 'Alert when tracked enemy players come online', defaultOn: true, pro: true },
  { key: 'pop-alerts',          label: 'Population alerts',        desc: 'Ping when server hits high pop or queue', defaultOn: false, pro: true },
  { key: 'pre-wipe-reminder',   label: 'Pre-wipe reminder',        desc: 'Ping all members 2 hours before wipe', defaultOn: true },
  { key: 'raid-reminder',       label: 'Raid reminders',           desc: 'Remind raid attendees 30 minutes before', defaultOn: true },
  { key: 'activity-check',      label: 'Weekly activity check',    desc: 'Flag inactive members each Monday', defaultOn: false, pro: true },
  { key: 'bm-sync',             label: 'BattleMetrics auto-sync',  desc: 'Sync playtime from BattleMetrics every 15 min', defaultOn: true, pro: true },
]

function ToggleSwitch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-10 h-5 rounded-full transition-colors ${on ? 'bg-rust-500' : 'bg-dark-400'}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(automationToggles.map(t => [t.key, t.defaultOn]))
  )

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Bot configuration for Iron Fist Clan</p>
        </div>
        <button onClick={handleSave} className="btn-primary text-sm">
          {saved ? <><Check size={14} />Saved!</> : <><Save size={14} />Save Changes</>}
        </button>
      </div>

      {/* Plan info */}
      <div className="card border-rust-500/25 bg-rust-500/5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown size={18} className="text-rust-400" />
            <div>
              <div className="text-sm font-semibold text-white">Pro Trial</div>
              <div className="text-xs text-gray-500">9 days remaining · All features unlocked</div>
            </div>
          </div>
          <Link href="/pricing" className="btn-primary text-xs px-4 py-2">Upgrade</Link>
        </div>
      </div>

      {/* Server config */}
      <div className="card border-dark-400 mb-5">
        <h2 className="text-sm font-semibold text-white mb-4">Server Configuration</h2>
        <div className="space-y-3">
          {[
            { label: 'BattleMetrics Server ID', value: '123456', placeholder: 'e.g. 123456' },
            { label: 'Steam API Key', value: '••••••••••••••••••••••••••••••••', placeholder: 'Your Steam API key' },
          ].map(field => (
            <div key={field.label}>
              <label className="text-xs text-gray-500 mb-1.5 block">{field.label}</label>
              <input className="input" defaultValue={field.value} placeholder={field.placeholder} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Wipe Day (0=Sun)</label>
              <select className="input">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => (
                  <option key={d} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Wipe Hour (UTC)</label>
              <input className="input" type="number" defaultValue={19} min={0} max={23} />
            </div>
          </div>
        </div>
      </div>

      {/* Promotion thresholds */}
      <div className="card border-dark-400 mb-5">
        <h2 className="text-sm font-semibold text-white mb-1">Auto-Promotion Thresholds</h2>
        <p className="text-xs text-gray-600 mb-4">Recruit is promoted to Member when ALL thresholds are met.</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Min wipe hours', defaultValue: 20 },
            { label: 'Min raids', defaultValue: 3 },
            { label: 'Min days in clan', defaultValue: 7 },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs text-gray-500 mb-1.5 block">{f.label}</label>
              <input className="input" type="number" defaultValue={f.defaultValue} />
            </div>
          ))}
        </div>
      </div>

      {/* Automation toggles */}
      <div className="card border-dark-400 mb-5">
        <h2 className="text-sm font-semibold text-white mb-4">Automation</h2>
        <div className="space-y-0">
          {automationToggles.map((t, i) => (
            <div
              key={t.key}
              className={`flex items-center justify-between gap-4 py-3.5 ${
                i < automationToggles.length - 1 ? 'border-b border-dark-400/50' : ''
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  {t.label}
                  {t.pro && (
                    <span className="badge bg-rust-500/15 text-rust-400 border border-rust-500/25 text-[10px]">
                      <Crown size={9} />
                      Pro
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">{t.desc}</div>
              </div>
              <ToggleSwitch
                on={toggles[t.key]}
                onChange={v => setToggles(prev => ({ ...prev, [t.key]: v }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="card border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={15} className="text-red-400" />
          <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-white">Reset wipe stats</div>
              <div className="text-xs text-gray-600">Moves current wipe to history and resets all wipe stats. Use at wipe start.</div>
            </div>
            <button className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/10 transition-colors shrink-0">
              Wipe Reset
            </button>
          </div>
          <div className="border-t border-red-500/20 pt-3 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-white">Remove bot from server</div>
              <div className="text-xs text-gray-600">Removes the bot and all data. This cannot be undone.</div>
            </div>
            <button className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 text-xs font-semibold hover:bg-red-500/15 transition-colors shrink-0">
              Remove Bot
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
