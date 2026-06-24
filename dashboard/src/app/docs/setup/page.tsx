import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Terminal, ChevronRight, AlertTriangle, Info, Check, ExternalLink, Flame } from 'lucide-react'

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  return (
    <div className="rounded-xl border border-dark-300 bg-dark-700 overflow-hidden my-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-dark-400 bg-dark-600">
        <span className="text-xs font-mono text-gray-500">{lang}</span>
        <Terminal size={13} className="text-gray-600" />
      </div>
      <pre className="px-4 py-4 text-sm font-mono text-gray-300 overflow-x-auto whitespace-pre">{code}</pre>
    </div>
  )
}

function Note({ type, children }: { type: 'info' | 'warning' | 'tip'; children: React.ReactNode }) {
  const map = {
    info:    { Icon: Info,          border: 'border-blue-500/30',   bg: 'bg-blue-500/8',   text: 'text-blue-400'   },
    warning: { Icon: AlertTriangle, border: 'border-yellow-500/30', bg: 'bg-yellow-500/8', text: 'text-yellow-400' },
    tip:     { Icon: Check,         border: 'border-green-500/30',  bg: 'bg-green-500/8',  text: 'text-green-400'  },
  }
  const { Icon, border, bg, text } = map[type]
  return (
    <div className={`rounded-xl border ${border} ${bg} p-4 my-4 flex gap-3`}>
      <Icon size={16} className={`${text} shrink-0 mt-0.5`} />
      <div className={`text-sm leading-relaxed ${text === 'text-blue-400' ? 'text-gray-300' : 'text-gray-300'}`}>{children}</div>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="relative pl-12 pb-12 border-l border-dark-300 last:border-0 last:pb-0">
      <div className="absolute -left-5 w-10 h-10 rounded-full bg-dark-500 border border-dark-300 flex items-center justify-center text-sm font-bold text-rust-400">
        {n}
      </div>
      <h3 className="text-lg font-semibold text-white mb-3 -mt-1">{title}</h3>
      <div className="text-gray-400 space-y-2 text-sm leading-relaxed">{children}</div>
    </div>
  )
}

const sidebarLinks = [
  { href: '#prereqs',    label: 'Prerequisites' },
  { href: '#invite',     label: '1. Invite the Bot' },
  { href: '#setup-cmd',  label: '2. Run /setup' },
  { href: '#wipe',       label: '3. Configure Wipe' },
  { href: '#battlemetrics', label: '4. BattleMetrics' },
  { href: '#rustplus',   label: '5. Rust+ (Optional)' },
  { href: '#automation', label: '6. Automation' },
  { href: '#checklist',  label: 'Setup Checklist' },
  { href: '#selfhost',   label: 'Self-Hosting' },
]

export default function SetupGuidePage() {
  return (
    <div className="min-h-screen bg-dark-800 flex flex-col">
      <Navbar />

      <div className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex gap-10">

            {/* Sidebar */}
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-24">
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-4">On this page</div>
                <nav className="space-y-1">
                  {sidebarLinks.map(l => (
                    <a key={l.href} href={l.href}
                      className="block text-sm text-gray-500 hover:text-rust-400 py-1 transition-colors">
                      {l.label}
                    </a>
                  ))}
                </nav>

                <div className="mt-8 pt-6 border-t border-dark-400">
                  <div className="text-xs text-gray-600 mb-3">Need help?</div>
                  <a href="#" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-indigo-400" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.085.118 18.1.135 18.1a19.843 19.843 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                    </svg>
                    Join support server
                  </a>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0 max-w-3xl">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                <Link href="/" className="hover:text-gray-400 transition-colors">Home</Link>
                <ChevronRight size={14} />
                <span>Docs</span>
                <ChevronRight size={14} />
                <span className="text-gray-300">Setup Guide</span>
              </div>

              <div className="mb-10">
                <div className="section-label mb-3">Getting Started</div>
                <h1 className="text-4xl font-black text-white mb-4">Setup Guide</h1>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Get RustClanBot fully configured in your Discord server in under 10 minutes.
                  Follow these steps in order.
                </p>
                <div className="flex flex-wrap gap-3 mt-5">
                  <span className="badge bg-green-500/15 text-green-400 border border-green-500/25">Beginner-friendly</span>
                  <span className="badge bg-blue-500/15 text-blue-400 border border-blue-500/25">~10 minutes</span>
                  <span className="badge bg-dark-400 text-gray-400 border border-dark-300">Requires Manage Server permission</span>
                </div>
              </div>

              {/* Prerequisites */}
              <section id="prereqs" className="mb-12">
                <h2 className="text-xl font-bold text-white mb-4">Prerequisites</h2>
                <ul className="space-y-2.5">
                  {[
                    'You are the owner or have **Manage Server** and **Manage Roles** permissions',
                    'Your server already has roles for Leader, Officer, Member, Recruit, and Unverified (or equivalents)',
                    'You have channels set up for raid alerts, applications, logs, leaderboard, and wipe info (or plan to create them)',
                    'A BattleMetrics account with your Rust server ID handy (optional but recommended)',
                  ].map((item, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-gray-400">
                      <Check size={14} className="text-rust-400 shrink-0 mt-0.5" />
                      <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-200">$1</strong>') }} />
                    </li>
                  ))}
                </ul>
              </section>

              {/* Steps */}
              <section className="mb-12 space-y-0">
                <h2 className="text-xl font-bold text-white mb-8">Step-by-step setup</h2>

                <Step n={1} title="Invite the bot to your server">
                  <p id="invite">
                    Click the <strong className="text-white">Add to Discord</strong> button and select your server.
                    Make sure to grant all requested permissions — the bot needs them to manage roles and post to channels.
                  </p>
                  <Note type="info">
                    The bot will DM you a welcome message with your 14-day Pro trial confirmation. No credit card needed.
                  </Note>
                  <a href="#" className="inline-flex items-center gap-2 text-rust-400 hover:text-rust-300 text-sm font-medium mt-2">
                    Add to Discord <ExternalLink size={13} />
                  </a>
                </Step>

                <Step n={2} title="Run /setup to configure roles and channels">
                  <p id="setup-cmd">
                    Once the bot is in your server, use the <code className="text-rust-300 bg-dark-500 px-1.5 py-0.5 rounded">/setup</code> command.
                    You'll be guided through picking:
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-2 text-gray-400">
                    <li>Leader, Officer, Member, Recruit, and Unverified roles</li>
                    <li>Log channel, application channel, raid channel, wipe channel</li>
                    <li>Leaderboard channel and pop-tracker channel</li>
                    <li>Optional: in-game name link channel, ID log channel</li>
                  </ul>
                  <Note type="tip">
                    You can re-run <code className="text-green-300 bg-dark-500 px-1 rounded">/setup</code> at any time to update individual settings without losing your data.
                  </Note>
                  <CodeBlock code="/setup" lang="discord command" />
                </Step>

                <Step n={3} title="Configure your wipe settings">
                  <div id="wipe">
                    <p>Tell the bot about your current wipe and server so it can show countdowns and track wipe stats.</p>
                    <CodeBlock
                      code={`/wipe server <battlemetrics-server-id>
/wipe plan <server-id> <wipe-date>
/setwipe <date> <type>`}
                      lang="discord commands"
                    />
                    <p className="mt-3">Find your BattleMetrics server ID in the URL when viewing your server at <strong className="text-white">battlemetrics.com/servers/rust</strong>.</p>
                    <Note type="info">
                      The wipe countdown will automatically appear in your wipe channel, updating every 10 minutes.
                    </Note>
                  </div>
                </Step>

                <Step n={4} title="Link BattleMetrics for auto time-tracking">
                  <div id="battlemetrics">
                    <p>
                      BattleMetrics integration lets the bot automatically track member playtime without manual check-ins.
                      Members link their BattleMetrics profile with:
                    </p>
                    <CodeBlock code="/setbattlemetrics <your-battlemetrics-player-url>" lang="discord command" />
                    <p>As an officer, you'll also want to set a Steam API key for verifying Rust hours on applications:</p>
                    <CodeBlock
                      code={`# Add to your .env file (self-hosted) or Bot Settings dashboard (hosted):
STEAM_API_KEY=your_steam_api_key_here
BATTLEMETRICS_API_TOKEN=your_bm_token_here`}
                      lang="env"
                    />
                    <Note type="tip">
                      Get your free Steam API key at <strong className="text-white">steamcommunity.com/dev/apikey</strong>.
                      BattleMetrics API tokens are available from your BM dashboard.
                    </Note>
                  </div>
                </Step>

                <Step n={5} title="Set up Rust+ integration (optional, Pro only)">
                  <div id="rustplus">
                    <p>Rust+ lets the bot relay in-game team chat to Discord, alert you to helis/cargo, and forward smart alarms.</p>

                    <Note type="warning">
                      Rust+ setup requires your Rust game client to be running on the target server.
                      This is a one-time process per server change.
                    </Note>

                    <p className="mt-3">Step 1 — Register for FCM push notifications (run this locally once):</p>
                    <CodeBlock code="npm run rustplus:register" lang="bash" />

                    <p>Step 2 — Pair the bot with your Rust server from in-game:</p>
                    <CodeBlock code="/rustplus pair" lang="discord command" />

                    <p>Step 3 — Configure which channels receive which events:</p>
                    <CodeBlock
                      code={`/rustplus channel chat #team-chat
/rustplus channel events #raid-alerts
/rustplus channel alarms #base-alarms`}
                      lang="discord commands"
                    />
                  </div>
                </Step>

                <Step n={6} title="Review and configure automation">
                  <div id="automation">
                    <p>The bot ships with 20+ automation toggles. View current settings with:</p>
                    <CodeBlock code="/automation view" lang="discord command" />
                    <p>Toggle individual automations:</p>
                    <CodeBlock
                      code={`/automation toggle auto-promote on
/automation toggle daily-tasks on
/automation toggle enemy-alerts on
/automation toggle pop-alerts on`}
                      lang="discord commands"
                    />
                    <p className="mt-3">Configure promotion thresholds:</p>
                    <CodeBlock
                      code={`# Auto-promote Recruit → Member when they reach:
/automation specialist hours 20    # minimum wipe hours
/automation specialist raids 3     # minimum raids attended
/automation specialist days 7      # minimum days in clan`}
                      lang="discord commands"
                    />
                  </div>
                </Step>
              </section>

              {/* Checklist */}
              <section id="checklist" className="mb-12">
                <h2 className="text-xl font-bold text-white mb-5">Setup checklist</h2>
                <div className="card border-dark-300 space-y-3">
                  {[
                    ['Bot invited with all permissions', true],
                    ['/setup completed (roles + channels configured)', false],
                    ['Wipe date and BattleMetrics server ID set', false],
                    ['Members have run /setbattlemetrics', false],
                    ['Members have run /setingamename', false],
                    ['Automation settings reviewed', false],
                    ['Rust+ paired (if using Pro)', false],
                    ['Test leaderboard post with /leaderboard', false],
                    ['Test raid with /raid', false],
                  ].map(([label, done]) => (
                    <div key={label as string} className="flex items-center gap-3 text-sm">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                        done ? 'border-green-500 bg-green-500/20' : 'border-dark-300'
                      }`}>
                        {done && <Check size={11} className="text-green-400" />}
                      </div>
                      <span className={done ? 'text-gray-500 line-through' : 'text-gray-300'}>{label as string}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Self-hosting */}
              <section id="selfhost" className="mb-12">
                <h2 className="text-xl font-bold text-white mb-5">Self-hosting</h2>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  Clone the open source repo and run the bot on your own infrastructure for free.
                  All features are unlocked when self-hosting.
                </p>

                <CodeBlock
                  code={`# 1. Clone the repo
git clone https://github.com/your-org/rust-clan-bot.git
cd rust-clan-bot

# 2. Install dependencies
npm install

# 3. Copy and fill in environment variables
cp .env.example .env
# Edit .env with your bot token, IDs, and API keys

# 4. Copy default data files
cp data/config.example.json data/config.json
cp data/wipe.example.json data/wipe.json
# ... (repeat for each .example.json)

# 5. Register slash commands
npm run deploy-commands

# 6. Start the bot
node index.js`}
                  lang="bash"
                />

                <Note type="info">
                  Node.js 20 or higher is required. The bot uses JSON flat files for storage — no database setup needed.
                </Note>

                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Required environment variables</h4>
                  <div className="rounded-xl border border-dark-300 overflow-hidden">
                    {[
                      ['BOT_TOKEN', 'Your Discord bot token from Discord Developer Portal'],
                      ['CLIENT_ID', 'Application ID from Discord Developer Portal'],
                      ['GUILD_ID', '(Optional) Your server ID for guild-only command registration'],
                      ['STEAM_API_KEY', 'Free key from steamcommunity.com/dev/apikey'],
                      ['BATTLEMETRICS_SERVER_ID', 'ID from BattleMetrics server URL'],
                      ['BATTLEMETRICS_API_TOKEN', 'From your BattleMetrics dashboard'],
                    ].map(([key, desc], i) => (
                      <div key={key} className={`grid grid-cols-2 gap-4 px-4 py-3 text-xs border-b border-dark-400/50 ${i % 2 === 0 ? 'bg-dark-600' : 'bg-dark-700/50'}`}>
                        <code className="text-rust-300 font-mono">{key}</code>
                        <span className="text-gray-500">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Next steps */}
              <section className="rounded-2xl border border-rust-500/20 bg-rust-500/5 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Flame size={18} className="text-rust-400" />
                  <h3 className="font-bold text-white">You're all set!</h3>
                </div>
                <p className="text-sm text-gray-400 mb-5">
                  Your bot is configured and ready to go. Here's what to do next:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'View all commands', href: '#' },
                    { label: 'Explore automation options', href: '#' },
                    { label: 'Join the support Discord', href: '#' },
                    { label: 'View the demo dashboard', href: '/dashboard' },
                  ].map(l => (
                    <Link key={l.label} href={l.href}
                      className="flex items-center justify-between px-4 py-3 rounded-lg bg-dark-600 border border-dark-300 hover:border-dark-200 text-sm text-gray-300 hover:text-white transition-all group">
                      {l.label}
                      <ChevronRight size={14} className="text-gray-600 group-hover:text-rust-400 transition-colors" />
                    </Link>
                  ))}
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
