'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Save, Crown, AlertTriangle, Check, Key, Radio, ExternalLink,
  Eye, EyeOff, CheckCircle, XCircle,
} from 'lucide-react'

type Tab = 'general' | 'integrations' | 'automation' | 'danger'

const automationToggles = [
  { key: 'auto-promote',      label: 'Auto-promote Recruits',    desc: 'Automatically promote Recruits to Member when they hit thresholds', defaultOn: true },
  { key: 'auto-leaderboard',  label: 'Auto-leaderboard posting', desc: 'Post leaderboard to channel every 30 minutes',                       defaultOn: true },
  { key: 'wipe-countdown',    label: 'Wipe countdown rename',    desc: 'Rename wipe channel with live countdown',                            defaultOn: true },
  { key: 'daily-tasks',       label: 'Daily task generation',    desc: 'Auto-generate random daily tasks each morning',                       defaultOn: false, pro: true },
  { key: 'enemy-alerts',      label: 'Enemy online alerts',      desc: 'Alert when tracked enemy players come online',                        defaultOn: true,  pro: true },
  { key: 'pop-alerts',        label: 'Population alerts',        desc: 'Ping when server hits high pop or queue',                            defaultOn: false, pro: true },
  { key: 'pre-wipe-reminder', label: 'Pre-wipe reminder',        desc: 'Ping all members 2 hours before wipe',                              defaultOn: true },
  { key: 'raid-reminder',     label: 'Raid reminders',           desc: 'Remind raid attendees 30 minutes before',                            defaultOn: true },
  { key: 'activity-check',    label: 'Weekly activity check',    desc: 'Flag inactive members each Monday',                                  defaultOn: false, pro: true },
  { key: 'bm-sync',           label: 'BattleMetrics auto-sync',  desc: 'Sync playtime from BattleMetrics every 15 min',                     defaultOn: true,  pro: true },
]

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)}
      className={`relative w-10 h-5 rounded-full transition-colors ${on ? 'bg-rust-500' : 'bg-dark-400'}`}>
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function ApiKeyField({
  label, envKey, placeholder, helpUrl, helpLabel, connected, note,
}: {
  label: string; envKey: string; placeholder: string
  helpUrl: string; helpLabel: string
  connected: boolean; note?: string
}) {
  const [show, setShow] = useState(false)
  const [value, setValue] = useState(connected ? '••••••••••••••••••••••••••••••••' : '')

  return (
    <div className="rounded-xl border border-dark-400 bg-dark-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Key size={14} className="text-gray-500 shrink-0" />
          <span className="text-sm font-semibold text-white">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {connected
            ? <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle size={12} />Connected</span>
            : <span className="flex items-center gap-1 text-xs text-red-400"><XCircle size={12} />Not set</span>
          }
        </div>
      </div>

      <div className="relative mb-2">
        <input
          type={show ? 'text' : 'password'}
          className="input pr-9 font-mono text-xs"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono text-gray-700">{envKey}</div>
        <a
          href={helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-rust-400 hover:text-rust-300 transition-colors"
        >
          {helpLabel}
          <ExternalLink size={9} />
        </a>
      </div>

      {note && <p className="text-[10px] text-gray-600 mt-2 leading-relaxed">{note}</p>}
    </div>
  )
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('general')
  const [saved, setSaved] = useState(false)
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(automationToggles.map(t => [t.key, t.defaultOn]))
  )

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'general',      label: 'General' },
    { key: 'integrations', label: 'Integrations' },
    { key: 'automation',   label: 'Automation' },
    { key: 'danger',       label: 'Danger Zone' },
  ]

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Bot configuration for Iron Fist Clan</p>
        </div>
        <button onClick={handleSave} className="btn-primary text-sm">
          {saved ? <><Check size={14} />Saved!</> : <><Save size={14} />Save Changes</>}
        </button>
      </div>

      {/* Plan info */}
      <div className="card border-rust-500/25 bg-rust-500/5 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown size={18} className="text-rust-400" />
          <div>
            <div className="text-sm font-semibold text-white">Pro Trial</div>
            <div className="text-xs text-gray-500">9 days remaining · All features unlocked</div>
          </div>
        </div>
        <Link href="/pricing" className="btn-primary text-xs px-4 py-2">Upgrade</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-dark-400 bg-dark-600 p-1 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
              tab === t.key
                ? t.key === 'danger'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-dark-400 text-white'
                : t.key === 'danger'
                  ? 'text-red-600 hover:text-red-400'
                  : 'text-gray-500 hover:text-gray-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* General */}
      {tab === 'general' && (
        <div className="space-y-4">
          <div className="card border-dark-400">
            <h2 className="text-sm font-semibold text-white mb-4">Server configuration</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">BattleMetrics Server ID</label>
                <input className="input" defaultValue="123456" placeholder="e.g. 123456" />
                <p className="text-[10px] text-gray-600 mt-1">Found in the URL on battlemetrics.com/servers/rust/123456</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Wipe Day</label>
                  <select className="input">
                    {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d, i) => (
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

          <div className="card border-dark-400">
            <h2 className="text-sm font-semibold text-white mb-1">Auto-Promotion Thresholds</h2>
            <p className="text-xs text-gray-600 mb-4">Recruit is promoted to Member when ALL thresholds are met.</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Min wipe hours', defaultValue: 20 },
                { label: 'Min raids',      defaultValue: 3 },
                { label: 'Min days',       defaultValue: 7 },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs text-gray-500 mb-1.5 block">{f.label}</label>
                  <input className="input" type="number" defaultValue={f.defaultValue} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Integrations */}
      {tab === 'integrations' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-gray-400 leading-relaxed">
            API keys are stored encrypted and never shared. You own your keys — we only use them to make
            requests on behalf of your server.{' '}
            <Link href="/docs/integrations" className="text-blue-400 hover:text-blue-300 transition-colors">
              Read the integrations guide →
            </Link>
          </div>

          <ApiKeyField
            label="Steam API Key"
            envKey="STEAM_API_KEY"
            placeholder="Paste your Steam Web API key…"
            helpUrl="https://steamcommunity.com/dev/apikey"
            helpLabel="Get a key at steamcommunity.com"
            connected={true}
            note="Used to verify Rust hours on member applications. Free and rate-limit friendly."
          />

          <ApiKeyField
            label="BattleMetrics API Token"
            envKey="BATTLEMETRICS_API_TOKEN"
            placeholder="Paste your BattleMetrics API token…"
            helpUrl="https://www.battlemetrics.com/developers"
            helpLabel="Create a token at battlemetrics.com"
            connected={true}
            note="Used for automatic playtime sync every 15 minutes. Required for wipe countdown and population graphs."
          />

          <div className="rounded-xl border border-dark-400 bg-dark-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-purple-400 shrink-0" />
                <span className="text-sm font-semibold text-white">Rust+</span>
                <span className="badge bg-purple-500/15 text-purple-400 border border-purple-500/25 text-[10px]">
                  <Crown size={8} />Pro
                </span>
              </div>
              <span className="flex items-center gap-1 text-xs text-green-400">
                <CheckCircle size={12} />Connected
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Rust+ uses device pairing — not an API key. Run <code className="text-gray-300 bg-dark-600 px-1 rounded">npm run rustplus:register</code> once,
              then pair from in-game with <code className="text-gray-300 bg-dark-600 px-1 rounded">/rustplus pair</code>.
            </p>
            <Link href="/docs/rustplus" className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
              Rust+ setup guide <ExternalLink size={10} />
            </Link>
          </div>

          <div className="rounded-xl border border-dark-400 bg-dark-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-[#7289da]" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.085.118 18.1.135 18.1a19.843 19.843 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              <span className="text-sm font-semibold text-white">Discord OAuth</span>
              <span className="text-xs text-gray-600">(for dashboard login)</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-600 mb-1 block">Client ID</label>
                <input className="input text-xs font-mono" placeholder="Discord application client ID" />
              </div>
              <div>
                <label className="text-[10px] text-gray-600 mb-1 block">Client Secret</label>
                <input className="input text-xs font-mono" type="password" placeholder="Discord application client secret" />
              </div>
              <div>
                <label className="text-[10px] text-gray-600 mb-1 block">Redirect URI</label>
                <input className="input text-xs font-mono" placeholder="https://your-domain.com/api/auth/callback" />
              </div>
            </div>
            <a
              href="https://discord.com/developers/applications"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-[#7289da] hover:text-blue-300 transition-colors mt-3"
            >
              Create an app at discord.com/developers <ExternalLink size={9} />
            </a>
          </div>
        </div>
      )}

      {/* Automation */}
      {tab === 'automation' && (
        <div className="card border-dark-400">
          <div className="space-y-0">
            {automationToggles.map((t, i) => (
              <div key={t.key}
                className={`flex items-center justify-between gap-4 py-3.5 ${
                  i < automationToggles.length - 1 ? 'border-b border-dark-400/50' : ''
                }`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    {t.label}
                    {t.pro && (
                      <span className="badge bg-purple-500/15 text-purple-400 border border-purple-500/25 text-[10px]">
                        <Crown size={8} />Pro
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">{t.desc}</div>
                </div>
                <Toggle on={toggles[t.key]} onChange={v => setToggles(p => ({ ...p, [t.key]: v }))} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      {tab === 'danger' && (
        <div className="card border-red-500/20 bg-red-500/5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={15} className="text-red-400" />
            <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
          </div>
          {[
            {
              title: 'Reset wipe stats',
              desc: 'Moves current wipe to history and resets all wipe stats. Use at wipe start. Cannot be undone.',
              btnLabel: 'Wipe Reset',
            },
            {
              title: 'Clear all intel notes',
              desc: 'Permanently deletes all intel notes for the current wipe. Use before next wipe.',
              btnLabel: 'Clear Intel',
            },
            {
              title: 'Remove bot from server',
              desc: 'Removes the bot and schedules all data for deletion within 30 days.',
              btnLabel: 'Remove Bot',
            },
          ].map((item, i) => (
            <div key={item.title}
              className={`flex items-center justify-between gap-4 ${i > 0 ? 'pt-4 border-t border-red-500/15' : ''}`}>
              <div>
                <div className="text-sm font-medium text-white">{item.title}</div>
                <div className="text-xs text-gray-600 mt-0.5">{item.desc}</div>
              </div>
              <button className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/10 transition-colors shrink-0">
                {item.btnLabel}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
