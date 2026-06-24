import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ChevronRight, Crown } from 'lucide-react'

type Cmd = { cmd: string; desc: string; tier: string; pro?: boolean }

const groups: { group: string; color: string; commands: Cmd[] }[] = [
  {
    group: 'Time Tracking',
    color: 'text-blue-400',
    commands: [
      { cmd: '/checkin',          desc: 'Start your play session timer.',                                    tier: 'Recruit+' },
      { cmd: '/checkout',         desc: 'End your play session and log the time.',                           tier: 'Recruit+' },
      { cmd: '/setingamename',    desc: 'Link your in-game name for auto-tracking.',                         tier: 'Recruit+' },
      { cmd: '/setsteam',         desc: 'Link your Steam profile to verify Rust hours.',                     tier: 'Recruit+' },
      { cmd: '/setbattlemetrics', desc: 'Link your BattleMetrics profile for automatic time sync.',          tier: 'Recruit+', pro: true },
      { cmd: '/stats [user]',     desc: 'View playtime and activity stats — your own or another member.',    tier: 'Recruit+' },
      { cmd: '/online',           desc: 'Show which members are currently online on the Rust server.',       tier: 'Member+' },
    ],
  },
  {
    group: 'Leaderboard',
    color: 'text-yellow-400',
    commands: [
      { cmd: '/leaderboard',      desc: 'Display the wipe or all-time leaderboard (top 10).',               tier: 'Recruit+' },
      { cmd: '/wipe-history',     desc: 'View historical wipe data and past rankings.',                      tier: 'Recruit+' },
    ],
  },
  {
    group: 'Tasks',
    color: 'text-teal-400',
    commands: [
      { cmd: '/task-assign',      desc: 'Create and assign a task with priority, category, and deadline.',   tier: 'Officer+' },
      { cmd: '/task-status',      desc: 'Check the status of a specific task.',                              tier: 'Member+' },
      { cmd: '/task-list',        desc: 'List all active tasks, optionally filtered by category.',           tier: 'Member+' },
      { cmd: '/task-delete',      desc: 'Delete a task by ID.',                                              tier: 'Officer+' },
      { cmd: '/task-auto',        desc: 'Trigger daily auto-generated tasks immediately.',                   tier: 'Officer+', pro: true },
    ],
  },
  {
    group: 'Wipe & Raids',
    color: 'text-red-400',
    commands: [
      { cmd: '/wipe info',        desc: 'Show the live wipe countdown and server info.',                     tier: 'Recruit+' },
      { cmd: '/wipe server <id>', desc: 'Switch the tracked BattleMetrics server.',                         tier: 'Officer+', pro: true },
      { cmd: '/wipe plan <id> <date>', desc: 'Schedule a future server switch on wipe day.',                tier: 'Officer+', pro: true },
      { cmd: '/raid',             desc: 'Schedule a raid with RSVP buttons (In / Out / Maybe).',            tier: 'Officer+' },
      { cmd: '/serverstatus',     desc: 'Check the live player count on the Rust server.',                   tier: 'Recruit+' },
      { cmd: '/popgraph',         desc: 'Display a population trend graph for the current server.',          tier: 'Member+', pro: true },
    ],
  },
  {
    group: 'Clan Management',
    color: 'text-green-400',
    commands: [
      { cmd: '/panel',            desc: 'Central member hub: link ID, apply for rank, request roles.',      tier: 'Recruit+' },
      { cmd: '/apply',            desc: 'Submit an application to join the clan.',                           tier: 'Unverified' },
      { cmd: '/application-review', desc: 'Review a pending application (approve or deny).',               tier: 'Officer+' },
      { cmd: '/warn <user>',      desc: 'Issue a formal warning to a member.',                               tier: 'Officer+' },
      { cmd: '/warnings <user>',  desc: 'View all warnings for a member.',                                   tier: 'Officer+' },
      { cmd: '/clearwarning',     desc: 'Remove a warning from a member.',                                   tier: 'Officer+' },
      { cmd: '/activity',         desc: 'Show a clan-wide activity and retention dashboard.',                tier: 'Officer+' },
      { cmd: '/member-info <user>', desc: 'View the full member profile for a user.',                      tier: 'Officer+' },
      { cmd: '/dashboard',        desc: 'Clan health overview with at-risk member flags.',                   tier: 'Officer+' },
    ],
  },
  {
    group: 'Rust+ Integration',
    color: 'text-purple-400',
    commands: [
      { cmd: '/rustplus pair',          desc: 'Pair the bot with your current Rust server.',                tier: 'Leader',  pro: true },
      { cmd: '/rustplus status',        desc: 'Check the Rust+ connection status.',                         tier: 'Officer+', pro: true },
      { cmd: '/rustplus say <message>', desc: 'Send a message to the in-game team chat.',                   tier: 'Member+', pro: true },
      { cmd: '/rustplus map',           desc: 'Get the current server map image.',                          tier: 'Member+', pro: true },
      { cmd: '/rustplus channel <type> <channel>', desc: 'Configure which Discord channel receives events.', tier: 'Officer+', pro: true },
    ],
  },
  {
    group: 'Intel',
    color: 'text-orange-400',
    commands: [
      { cmd: '/note-add',         desc: 'Add an intel note (enemy base, safe house, resource node).',       tier: 'Member+', pro: true },
      { cmd: '/note-list',        desc: 'List all intel notes for the current wipe.',                       tier: 'Member+', pro: true },
      { cmd: '/note-delete',      desc: 'Delete an intel note by ID.',                                      tier: 'Officer+', pro: true },
      { cmd: '/enemy',            desc: 'Track an enemy player and enable online alerts.',                  tier: 'Officer+', pro: true },
    ],
  },
  {
    group: 'Social & Allies',
    color: 'text-cyan-400',
    commands: [
      { cmd: '/poll',             desc: 'Create a multiple-choice poll with auto-close timer.',              tier: 'Member+' },
      { cmd: '/ally add',         desc: 'Add an allied, neutral, or enemy clan to the tracker.',            tier: 'Officer+', pro: true },
      { cmd: '/ally list',        desc: 'List all tracked ally/enemy clans.',                               tier: 'Member+', pro: true },
      { cmd: '/ally update',      desc: 'Update an ally status or notes.',                                  tier: 'Officer+', pro: true },
      { cmd: '/ally remove',      desc: 'Remove a clan from the tracker.',                                  tier: 'Officer+', pro: true },
    ],
  },
  {
    group: 'Admin',
    color: 'text-gray-400',
    commands: [
      { cmd: '/setup',            desc: 'Configure roles and channels. Run once on bot install.',            tier: 'Leader' },
      { cmd: '/setwipe <date>',   desc: 'Manually set the next wipe date and type.',                        tier: 'Leader' },
      { cmd: '/wipereset',        desc: 'Reset wipe stats and move current data to history.',               tier: 'Leader' },
      { cmd: '/automation view',  desc: 'View all automation toggle states.',                               tier: 'Leader' },
      { cmd: '/automation toggle <key> <on|off>', desc: 'Toggle any automation feature on or off.',        tier: 'Leader' },
      { cmd: '/help',             desc: 'Display all available commands grouped by category.',              tier: 'Recruit+' },
    ],
  },
]

const tierColor = (t: string) => ({
  'Unverified': 'bg-gray-500/15 text-gray-500',
  'Recruit+':   'bg-dark-400 text-gray-500',
  'Member+':    'bg-green-500/15 text-green-400',
  'Officer+':   'bg-blue-500/15 text-blue-400',
  'Leader':     'bg-yellow-500/15 text-yellow-400',
}[t] ?? 'bg-dark-400 text-gray-500')

export default function CommandsPage() {
  return (
    <div className="min-h-screen bg-dark-800 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <Link href="/docs" className="hover:text-gray-400 transition-colors">Docs</Link>
            <ChevronRight size={14} />
            <span className="text-gray-300">Commands Reference</span>
          </div>

          <div className="mb-10">
            <div className="section-label mb-3">Reference</div>
            <h1 className="text-4xl font-black text-white mb-4">Commands</h1>
            <p className="text-gray-400 max-w-2xl leading-relaxed">
              All {groups.reduce((n, g) => n + g.commands.length, 0)} slash commands, grouped by feature.
              Commands marked <span className="text-purple-400 font-semibold">Pro</span> require an active Pro plan.
              The <span className="text-yellow-400">Leader</span> tier means server owner / highest admin role.
            </p>
          </div>

          <div className="space-y-8">
            {groups.map(g => (
              <div key={g.group}>
                <h2 className={`text-base font-bold mb-3 ${g.color}`}>{g.group}</h2>
                <div className="rounded-xl border border-dark-400 overflow-hidden">
                  <div className="grid grid-cols-[2fr_3fr_1fr] bg-dark-600 border-b border-dark-400 px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div>Command</div>
                    <div>Description</div>
                    <div className="text-right">Min. role</div>
                  </div>
                  {g.commands.map((c, i) => (
                    <div key={c.cmd}
                      className={`grid grid-cols-[2fr_3fr_1fr] px-4 py-3 border-b border-dark-400/50 ${
                        i % 2 === 0 ? 'bg-dark-700/50' : 'bg-dark-600'
                      }`}>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-rust-300">{c.cmd}</code>
                        {c.pro && (
                          <span className="badge bg-purple-500/15 text-purple-400 border border-purple-500/25 text-[9px]">
                            <Crown size={8} />PRO
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 pr-4">{c.desc}</div>
                      <div className="flex justify-end">
                        <span className={`badge text-[10px] ${tierColor(c.tier)}`}>{c.tier}</span>
                      </div>
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
