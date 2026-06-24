import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ChevronRight, Crown } from 'lucide-react'

export default function StagesDocsPage() {
  return (
    <div className="min-h-screen bg-dark-800 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <Link href="/docs" className="hover:text-gray-400 transition-colors">Docs</Link>
            <ChevronRight size={14} />
            <span className="text-gray-300">Stage Manager</span>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="section-label">Pro Feature</div>
            <span className="badge bg-purple-500/15 text-purple-400 border border-purple-500/25 text-xs">
              <Crown size={10} />
              Requires Pro
            </span>
          </div>
          <h1 className="text-4xl font-black text-white mb-4">Stage Manager</h1>
          <p className="text-gray-400 mb-10 leading-relaxed">
            Stages let you define phases of your wipe cycle — Early Wipe, Farming for Raid, Active Raid, etc.
            Each stage has task templates per specialist role. When a member joins the Rust server (detected via Rust+),
            the bot auto-assigns the matching tasks to them in Discord.
          </p>

          <div className="space-y-8 text-sm text-gray-400">
            <div>
              <h2 className="text-lg font-bold text-white mb-3">How it works</h2>
              <ol className="list-decimal list-inside space-y-3 leading-relaxed">
                <li>Create stages in <Link href="/dashboard/tasks/stages" className="text-rust-400">Dashboard → Tasks → Stages</Link>. Each stage has a name, colour, and set of task templates.</li>
                <li>Each template is tied to a <strong className="text-white">specialist role</strong> (Farmer, PvP, Builder, Scout, Defender).</li>
                <li>Set one stage as <strong className="text-white">Active</strong>. Only one stage can be active at a time.</li>
                <li>Enable <strong className="text-white">Auto-assign</strong> in the dashboard. This requires Rust+ to be connected.</li>
                <li>When a member joins the Rust server, the bot checks their specialist role, finds matching templates in the active stage, and creates and assigns those tasks to them — all automatically.</li>
                <li>The member receives a Discord notification with their assigned task.</li>
              </ol>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-3">Specialist roles</h2>
              <p className="mb-3">Each member can have one specialist role. Officers assign roles via <code className="text-gray-300 bg-dark-500 px-1 rounded">/automation specialist</code> or from the member profile in the dashboard.</p>
              <div className="rounded-xl border border-dark-400 overflow-hidden">
                {[
                  ['⛏️ Farmer',   'farm',   'Assigned farming and resource collection tasks'],
                  ['⚔️ PvP',      'pvp',    'Assigned combat, patrol and raid push tasks'],
                  ['🏗️ Builder',  'build',  'Assigned base building, fortification and crafting tasks'],
                  ['🔭 Scout',    'scout',  'Assigned reconnaissance and intel gathering tasks'],
                  ['🛡️ Defender', 'defend', 'Assigned base defence and counter-raid tasks'],
                ].map(([label, key, desc], i) => (
                  <div key={key} className={`grid grid-cols-[120px_1fr] px-4 py-3 border-b border-dark-400/50 text-xs ${i % 2 === 0 ? 'bg-dark-700/50' : 'bg-dark-600'}`}>
                    <span className="font-semibold text-white">{label}</span>
                    <span className="text-gray-500">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-3">Example setup</h2>
              <p className="mb-3">A typical wipe might look like:</p>
              <div className="space-y-2">
                {[
                  { name: 'Early Wipe',          color: 'bg-green-500',  desc: 'Builders build, farmers gather wood/stone, scouts find monuments' },
                  { name: 'Farming for Raid',     color: 'bg-yellow-500', desc: 'Farmers collect sulfur/metal, scouts watch target, builders craft' },
                  { name: 'Active Raid',          color: 'bg-red-500',    desc: 'PvP pushes, builders do towers, defenders guard rear, farmers resupply' },
                  { name: 'Post-Raid Recovery',   color: 'bg-blue-500',   desc: 'Farmers sort loot, builders expand, defenders reinforce base' },
                ].map(s => (
                  <div key={s.name} className="flex items-start gap-3 p-3 rounded-lg bg-dark-600 border border-dark-400">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.color} mt-1 shrink-0`} />
                    <div>
                      <div className="text-sm font-semibold text-white">{s.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Crown size={14} className="text-purple-400" />
                <span className="text-sm font-semibold text-white">Ready to set up stages?</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">Stage Manager is a Pro feature. Start your 14-day free trial to try it.</p>
              <div className="flex gap-3">
                <Link href="/dashboard/tasks/stages" className="btn-primary text-xs px-4 py-2">Open Stage Manager</Link>
                <Link href="/pricing" className="btn-secondary text-xs px-4 py-2">View pricing</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
