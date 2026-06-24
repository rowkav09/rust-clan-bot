import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ChevronRight, ExternalLink, Check, AlertTriangle, Key } from 'lucide-react'

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="rounded-lg bg-dark-700 border border-dark-400 px-4 py-3 text-xs font-mono text-gray-300 overflow-x-auto my-3 whitespace-pre">{code}</pre>
  )
}

function Note({ type, children }: { type: 'info' | 'warning'; children: React.ReactNode }) {
  const s = type === 'info'
    ? { border: 'border-blue-500/30', bg: 'bg-blue-500/8', text: 'text-blue-400', Icon: Check }
    : { border: 'border-yellow-500/30', bg: 'bg-yellow-500/8', text: 'text-yellow-400', Icon: AlertTriangle }
  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} p-4 my-4 flex gap-3`}>
      <s.Icon size={15} className={`${s.text} shrink-0 mt-0.5`} />
      <div className="text-sm text-gray-300 leading-relaxed">{children}</div>
    </div>
  )
}

export default function IntegrationsDocsPage() {
  return (
    <div className="min-h-screen bg-dark-800 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <Link href="/docs" className="hover:text-gray-400 transition-colors">Docs</Link>
            <ChevronRight size={14} />
            <span className="text-gray-300">API Keys & Integrations</span>
          </div>

          <div className="section-label mb-3">Integrations</div>
          <h1 className="text-4xl font-black text-white mb-4">API Keys & Integrations</h1>
          <p className="text-gray-400 mb-10 leading-relaxed">
            RustClanBot uses your own API keys for Steam and BattleMetrics — we never pool credentials.
            Keys are stored encrypted and only used to make requests on behalf of your server.
          </p>

          {/* Steam API Key */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Key size={16} className="text-cyan-400" />
              <h2 className="text-xl font-bold text-white">Steam API Key</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Used to verify Rust hour counts on member applications via Steam profiles.
              Without this, the bot cannot display <strong className="text-white">steamRustHours</strong> on applications.
            </p>
            <h3 className="text-sm font-semibold text-white mb-2">How to get one</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-400 mb-4">
              <li>Go to <span className="text-rust-400 font-mono text-xs">steamcommunity.com/dev/apikey</span></li>
              <li>Log in with your Steam account</li>
              <li>Enter any domain name (e.g. <code className="text-gray-300 bg-dark-500 px-1 rounded">localhost</code>)</li>
              <li>Copy the generated key</li>
            </ol>
            <Note type="info">
              The Steam API key is free and has a generous rate limit (100,000 requests/day).
              One key is enough for any clan size.
            </Note>
            <h3 className="text-sm font-semibold text-white mt-5 mb-2">Where to enter it</h3>
            <p className="text-sm text-gray-400 mb-2">
              Hosted bot: <Link href="/dashboard/settings" className="text-rust-400 hover:text-rust-300">Dashboard → Settings → Integrations</Link>
            </p>
            <p className="text-sm text-gray-400 mb-1">Self-hosted: add to your <code className="text-gray-300 bg-dark-500 px-1 rounded">.env</code> file:</p>
            <CodeBlock code="STEAM_API_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" />
          </section>

          {/* BattleMetrics */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Key size={16} className="text-green-400" />
              <h2 className="text-xl font-bold text-white">BattleMetrics API Token</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Used for automatic playtime sync (every 15 minutes), wipe countdown data, and server population graphs.
              Without this key, members must manually <code className="text-gray-300 bg-dark-500 px-1 rounded">/checkin</code> and <code className="text-gray-300 bg-dark-500 px-1 rounded">/checkout</code>.
            </p>
            <h3 className="text-sm font-semibold text-white mb-2">How to get one</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-400 mb-4">
              <li>Create a free account at <span className="text-rust-400 font-mono text-xs">battlemetrics.com</span></li>
              <li>Go to <strong className="text-white">Account → Manage → API Tokens</strong></li>
              <li>Click <strong className="text-white">New Token</strong></li>
              <li>Give it a name (e.g. <em>RustClanBot</em>), leave scopes as default</li>
              <li>Copy the token — it is only shown once</li>
            </ol>
            <Note type="warning">
              Save your BattleMetrics token immediately after creation. You cannot retrieve it later
              and will need to generate a new one if lost.
            </Note>
            <h3 className="text-sm font-semibold text-white mt-5 mb-2">Finding your Server ID</h3>
            <p className="text-sm text-gray-400 mb-2">
              Navigate to your server on BattleMetrics. The server ID is in the URL:
            </p>
            <CodeBlock code="https://www.battlemetrics.com/servers/rust/123456
                                                          ^^^^^^
                                                      This is your server ID" />
            <h3 className="text-sm font-semibold text-white mt-5 mb-2">Where to enter it</h3>
            <p className="text-sm text-gray-400 mb-2">
              Hosted bot: <Link href="/dashboard/settings" className="text-rust-400 hover:text-rust-300">Dashboard → Settings → Integrations</Link>
            </p>
            <CodeBlock code={`BATTLEMETRICS_API_TOKEN=your_token_here
BATTLEMETRICS_SERVER_ID=123456`} />
          </section>

          {/* Rust+ */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Key size={16} className="text-purple-400" />
              <h2 className="text-xl font-bold text-white">Rust+ (FCM Pairing)</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Rust+ does not use an API key — it uses a device pairing system built into the game.
              You register once per bot instance and then pair with each Rust server from in-game.
            </p>
            <p className="text-sm text-gray-400">
              See the <Link href="/docs/rustplus" className="text-rust-400 hover:text-rust-300">full Rust+ setup guide →</Link>
            </p>
          </section>

          <div className="rounded-xl border border-dark-300 bg-dark-600 p-6 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-white mb-1">Ready to connect?</div>
              <div className="text-sm text-gray-500">Add your API keys in the dashboard settings.</div>
            </div>
            <Link href="/dashboard/settings" className="btn-primary text-sm shrink-0">
              Open Settings
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
