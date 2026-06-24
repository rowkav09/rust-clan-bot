import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Crown } from 'lucide-react'

const entries = [
  {
    version: '2.4.0',
    date: 'June 24, 2026',
    tag: 'Latest',
    tagColor: 'bg-green-500/20 text-green-400',
    changes: [
      { type: 'new',  text: 'Stage Manager — configure wipe stages and auto-assign tasks by specialist role when members come online' },
      { type: 'new',  text: 'Web dashboard — full admin panel for clan management, leaderboard, tasks, raids, intel, and settings', pro: true },
      { type: 'new',  text: 'Discord OAuth login for dashboard administrators' },
      { type: 'new',  text: 'BYO API key management for Steam and BattleMetrics in dashboard settings' },
      { type: 'impr', text: 'Task cards now show "Auto-assigned" badge when created by stage trigger' },
      { type: 'impr', text: 'Sidebar Stages link added under Tasks with Pro badge' },
      { type: 'fix',  text: 'Fixed apostrophe syntax error in landing page features array' },
    ],
  },
  {
    version: '2.3.0',
    date: 'June 12, 2026',
    tag: 'Pro',
    tagColor: 'bg-purple-500/20 text-purple-400',
    changes: [
      { type: 'new',  text: 'Ally & enemy clan tracking with status (active / neutral / enemy)', pro: true },
      { type: 'new',  text: 'Population alerts — ping when server hits configurable threshold', pro: true },
      { type: 'new',  text: 'popgraph command — visual trend chart for server population', pro: true },
      { type: 'impr', text: 'Leaderboard now auto-updates every 30 minutes instead of hourly' },
      { type: 'impr', text: 'Wipe countdown channel rename now runs every 10 minutes' },
      { type: 'fix',  text: 'Fixed BattleMetrics sync occasionally double-counting hours on checkin' },
    ],
  },
  {
    version: '2.2.0',
    date: 'May 28, 2026',
    tag: null,
    tagColor: '',
    changes: [
      { type: 'new',  text: 'Rust+ integration — team chat bridge, heli/cargo alerts, smart alarms', pro: true },
      { type: 'new',  text: 'Online member detection via Rust+ for stage auto-assignment', pro: true },
      { type: 'new',  text: 'Intel notes system — track enemy bases, safe houses, resource nodes', pro: true },
      { type: 'impr', text: 'Application review now shows Steam hours and previous clan history' },
      { type: 'fix',  text: 'Fixed voice channel hour tracking resetting on bot restart' },
    ],
  },
  {
    version: '2.1.0',
    date: 'May 10, 2026',
    tag: null,
    tagColor: '',
    changes: [
      { type: 'new',  text: 'Wipe server scheduling — plan server switches in advance with /wipe plan' },
      { type: 'new',  text: 'Raid RSVP system with In / Out / Maybe buttons and 30-minute reminders' },
      { type: 'new',  text: 'Weekly activity check — auto-flag members inactive for 7+ days' },
      { type: 'impr', text: 'Leaderboard scoring formula now includes voice channel hours' },
      { type: 'fix',  text: 'Fixed /wipereset not clearing wipe raids from leaderboard' },
    ],
  },
  {
    version: '2.0.0',
    date: 'April 1, 2026',
    tag: 'Major',
    tagColor: 'bg-rust-500/20 text-rust-400',
    changes: [
      { type: 'new',  text: 'Complete rewrite in Discord.js v14 with slash commands' },
      { type: 'new',  text: 'BattleMetrics auto-sync for automatic playtime tracking', pro: true },
      { type: 'new',  text: 'Specialist role system — farm / pvp / build / scout / defend' },
      { type: 'new',  text: 'Task management with category, priority, and deadline' },
      { type: 'new',  text: 'Auto-promotion from Recruit to Member based on configurable thresholds' },
      { type: 'impr', text: 'Removed all prefix commands — everything is now a slash command' },
    ],
  },
]

const typeLabel = { new: 'New', impr: 'Improved', fix: 'Fixed' }
const typeColor = {
  new:  'bg-green-500/15 text-green-400 border-green-500/25',
  impr: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  fix:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-dark-800 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="section-label mb-3">What&apos;s new</div>
          <h1 className="text-4xl font-black text-white mb-4">Changelog</h1>
          <p className="text-gray-400 mb-12">Every update to RustClanBot, most recent first.</p>

          <div className="space-y-10">
            {entries.map(e => (
              <div key={e.version} className="relative pl-8 border-l border-dark-300">
                <div className="absolute -left-2 top-1.5 w-4 h-4 rounded-full bg-dark-500 border-2 border-dark-300" />

                <div className="flex items-center gap-3 mb-1">
                  <span className="text-lg font-black text-white">v{e.version}</span>
                  {e.tag && (
                    <span className={`badge border ${e.tagColor} text-[10px]`}>{e.tag}</span>
                  )}
                </div>
                <div className="text-xs text-gray-600 mb-4">{e.date}</div>

                <div className="space-y-2">
                  {e.changes.map((c, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className={`badge border text-[10px] shrink-0 mt-0.5 ${typeColor[c.type as keyof typeof typeColor]}`}>
                        {typeLabel[c.type as keyof typeof typeLabel]}
                      </span>
                      <span className="text-sm text-gray-300 leading-relaxed">
                        {c.text}
                        {c.pro && (
                          <span className="inline-flex items-center gap-0.5 ml-1.5 badge bg-purple-500/15 text-purple-400 border border-purple-500/25 text-[9px]">
                            <Crown size={8} />Pro
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
