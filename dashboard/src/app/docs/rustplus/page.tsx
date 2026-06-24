import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ChevronRight, Crown, AlertTriangle } from 'lucide-react'

function CodeBlock({ code }: { code: string }) {
  return <pre className="rounded-lg bg-dark-700 border border-dark-400 px-4 py-3 text-xs font-mono text-gray-300 overflow-x-auto my-3 whitespace-pre">{code}</pre>
}

export default function RustPlusDocsPage() {
  return (
    <div className="min-h-screen bg-dark-800 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <Link href="/docs" className="hover:text-gray-400 transition-colors">Docs</Link>
            <ChevronRight size={14} />
            <span className="text-gray-300">Rust+ Integration</span>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="section-label">Pro Feature</div>
            <span className="badge bg-purple-500/15 text-purple-400 border border-purple-500/25 text-xs">
              <Crown size={10} />Requires Pro
            </span>
          </div>
          <h1 className="text-4xl font-black text-white mb-4">Rust+ Integration</h1>
          <p className="text-gray-400 mb-10 leading-relaxed">
            Connect the bot to your Rust server via the Rust+ API for live team chat bridging,
            event alerts, smart alarms, and online detection used by the Stage Manager.
          </p>

          <div className="space-y-8 text-sm text-gray-400">
            <div>
              <h2 className="text-lg font-bold text-white mb-3">What you get</h2>
              <ul className="space-y-2">
                {[
                  'Team chat bridge — Discord ↔ in-game team chat in real time',
                  'Heli and cargo ship alerts to a configurable Discord channel',
                  'Smart alarm notifications forwarded to Discord',
                  'Teammate downed / killed alerts',
                  'Online detection — triggers Stage Manager auto-assignment',
                  'Map image on demand via /rustplus map',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-rust-400 mt-0.5">→</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-3">Setup (self-hosted)</h2>
              <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/5 p-4 mb-4 flex gap-2">
                <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                <div className="text-xs text-gray-300">
                  This process requires you to run the bot locally once to register with FCM.
                  After that, it runs headless on your server indefinitely until you wipe/change servers.
                </div>
              </div>
              <p className="mb-2">Step 1 — Register for push notifications (run once locally):</p>
              <CodeBlock code="npm run rustplus:register" />
              <p className="mb-2">Step 2 — In-game, open Rust+ and pair with the bot (from the command below):</p>
              <CodeBlock code="/rustplus pair" />
              <p className="mb-2">Step 3 — Configure event channels:</p>
              <CodeBlock code={`/rustplus channel chat #team-chat
/rustplus channel events #raid-alerts
/rustplus channel alarms #alarms`} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-3">After a wipe</h2>
              <p className="leading-relaxed">
                After each wipe, if you change servers, run <code className="text-gray-300 bg-dark-500 px-1 rounded">/rustplus pair</code> again from in-game
                on the new server. The previous pairing is automatically replaced.
                Your alert channel config carries over — you do not need to reconfigure channels.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
