import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import {
  Flame, Clock, Trophy, Swords, Users, Radio, Map, CheckSquare,
  ChevronRight, Star, Zap, Shield, BarChart3, MessageSquare, Bell,
  ArrowRight, Check
} from 'lucide-react'

const features = [
  {
    icon: Clock,
    title: 'Time Tracking',
    desc: 'Automatic check-in/check-out with BattleMetrics sync. Know exactly who's active each wipe.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Trophy,
    title: 'Leaderboards',
    desc: 'Wipe and all-time rankings with custom scoring. Auto-posts to your channel every 30 minutes.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  {
    icon: Swords,
    title: 'Raid Coordination',
    desc: 'Schedule raids with RSVP buttons, grid refs, and 30-minute reminder pings. Never miss a raid.',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
  {
    icon: Users,
    title: 'Clan Management',
    desc: 'Application reviews, member warnings, auto-promotion, and a full clan health dashboard.',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  {
    icon: Radio,
    title: 'Rust+ Integration',
    desc: 'Live team chat bridge, cargo/heli alerts, smart alarm notifications, and map previews.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Map,
    title: 'Intel System',
    desc: 'Track enemy bases, safe houses, and resource nodes with grid references and notes.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
  {
    icon: CheckSquare,
    title: 'Task Management',
    desc: 'Create and assign tasks by category, priority, and deadline. Auto-generate daily tasks.',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
  },
  {
    icon: BarChart3,
    title: 'Population Graphs',
    desc: 'Track server population over time with visual trend graphs. Set alerts for queue and peak pop.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
]

const steps = [
  { n: '01', title: 'Add the bot', desc: 'Invite RustClanBot to your Discord server in one click.' },
  { n: '02', title: 'Run /setup', desc: 'Point the bot to your roles and channels with a single command.' },
  { n: '03', title: 'Start playing', desc: 'Members check in, earn points, and compete on the leaderboard automatically.' },
]

const testimonials = [
  { text: "Our raid coordination has completely transformed. No more missed timers or attendance confusion.", author: "XxShadowWolfxX", role: "Clan Leader", clan: "Shadow Legion" },
  { text: "The auto-leaderboard keeps everyone motivated. Wipe participation went up 40% in our first week.", author: "TacticalMike99", role: "Officer", clan: "Iron Fist Clan" },
  { text: "Rust+ integration is insane. Getting heli alerts in Discord while offline is a game changer.", author: "BaseDefender", role: "Member", clan: "Bunker Boys" },
]

const freePlanFeatures = [
  'Time tracking (check-in/out)',
  'Basic leaderboard',
  'Task management',
  'Raid scheduling',
  'Member applications',
  'Up to 30 members',
]

const proPlanFeatures = [
  'Everything in Free',
  'Rust+ integration',
  'Intel & enemy tracking',
  'BattleMetrics auto-sync',
  'Population graphs & alerts',
  'Advanced automation (20+ toggles)',
  'Clan health dashboard',
  'Unlimited members',
  'Priority support',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-800 flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-100 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-rust-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-rust-500/30 bg-rust-500/10 text-rust-400 text-xs font-semibold mb-6">
            <Zap size={12} className="fill-current" />
            40+ commands · Auto-tracking · Rust+ integration
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white leading-none tracking-tight mb-6">
            The Ultimate<br />
            <span className="gradient-text">Rust Clan Bot</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Track playtime, coordinate raids, manage members, and dominate every wipe —
            all from within Discord. Setup takes under 5 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#" className="btn-primary px-7 py-3 text-base">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.085.118 18.1.135 18.1a19.843 19.843 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Add to Discord — Free
            </a>
            <Link href="/dashboard" className="btn-secondary px-7 py-3 text-base">
              View Demo Dashboard
              <ChevronRight size={16} />
            </Link>
          </div>

          <p className="mt-4 text-sm text-gray-600">No credit card required · Setup in 5 minutes · Free forever plan</p>
        </div>

        {/* Mock dashboard preview */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="rounded-2xl border border-dark-300 bg-dark-700 overflow-hidden shadow-2xl shadow-black/50">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-dark-400 bg-dark-600">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-xs text-gray-600 font-mono">dashboard.rustclanbot.com</span>
            </div>
            <div className="grid grid-cols-4 gap-3 p-6">
              {[
                { label: 'Total Members', value: '24', change: '+3', up: true },
                { label: 'Active This Wipe', value: '18', change: '+2', up: true },
                { label: 'Wipe Hours', value: '342h', change: '+87', up: true },
                { label: 'Raids', value: '12', change: '+1', up: true },
              ].map(stat => (
                <div key={stat.label} className="bg-dark-500 rounded-xl p-4 border border-dark-400">
                  <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-green-400 mt-1">↑ {stat.change} this wipe</div>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 grid grid-cols-3 gap-3">
              <div className="col-span-2 bg-dark-500 rounded-xl border border-dark-400 p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Activity — Last 7 Days</div>
                <div className="flex items-end gap-1 h-24">
                  {[42, 38, 65, 71, 58, 83, 49].map((v, i) => (
                    <div key={i} className="flex-1 rounded-t" style={{ height: `${(v / 83) * 100}%`, background: i === 5 ? '#e8622a' : '#22252e' }} />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  {['M','T','W','T','F','S','S'].map((d, i) => <span key={i}>{d}</span>)}
                </div>
              </div>
              <div className="bg-dark-500 rounded-xl border border-dark-400 p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Top Members</div>
                <div className="space-y-2">
                  {[
                    { rank: 1, name: 'RustLord', hours: '87h' },
                    { rank: 2, name: 'Hammer', hours: '64h' },
                    { rank: 3, name: 'Warlord', hours: '59h' },
                  ].map(m => (
                    <div key={m.rank} className="flex items-center gap-2 text-xs">
                      <span className="text-rust-500 font-bold w-4">{m.rank}</span>
                      <span className="text-gray-300 flex-1">{m.name}</span>
                      <span className="text-gray-500">{m.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-dark-800 via-transparent to-transparent pointer-events-none" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="section-label mb-3">Everything you need</div>
            <h2 className="text-4xl font-bold text-white mb-4">Built for serious clans</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Every feature was designed around real Rust clan workflows — from wipe day prep to end-of-wipe reviews.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(f => (
              <div key={f.title} className="card-hover group">
                <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon size={20} className={f.color} />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-dark-700 border-y border-dark-400">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="section-label mb-3">Dead simple setup</div>
            <h2 className="text-4xl font-bold text-white mb-4">Up and running in minutes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.n} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-1/2 w-full border-t border-dashed border-dark-300" />
                )}
                <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-rust-500/15 border border-rust-500/30 text-rust-400 font-mono font-bold text-sm mb-5">
                  {step.n}
                </div>
                <h3 className="font-semibold text-white text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/docs/setup" className="btn-secondary inline-flex">
              Read the full setup guide
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="section-label mb-3">What clans say</div>
            <h2 className="text-4xl font-bold text-white mb-4">Trusted by hundreds of clans</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.author} className="card border-dark-300">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-white text-sm">{t.author}</div>
                  <div className="text-xs text-gray-500">{t.role} · {t.clan}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-24 px-4 bg-dark-700 border-y border-dark-400">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="section-label mb-3">Pricing</div>
            <h2 className="text-4xl font-bold text-white mb-4">Start free, upgrade when ready</h2>
            <p className="text-gray-400">Free plan covers small-to-mid clans. Pro unlocks everything.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="card border-dark-300">
              <div className="mb-6">
                <div className="text-sm font-semibold text-gray-400 mb-1">Free</div>
                <div className="text-4xl font-black text-white">$0<span className="text-base font-normal text-gray-500">/month</span></div>
                <div className="text-sm text-gray-500 mt-1">Forever free. No credit card.</div>
              </div>
              <ul className="space-y-2.5 mb-8">
                {freePlanFeatures.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <Check size={14} className="text-green-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#" className="btn-secondary w-full justify-center">Add to Discord Free</a>
            </div>

            {/* Pro */}
            <div className="card relative border-rust-500/40 bg-gradient-to-b from-rust-500/5 to-transparent overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="badge bg-rust-500/20 text-rust-400 border border-rust-500/30">Most Popular</span>
              </div>
              <div className="mb-6">
                <div className="text-sm font-semibold text-rust-400 mb-1">Pro</div>
                <div className="text-4xl font-black text-white">$9.99<span className="text-base font-normal text-gray-500">/month</span></div>
                <div className="text-sm text-gray-500 mt-1">Or $79/year · Save 34%</div>
              </div>
              <ul className="space-y-2.5 mb-8">
                {proPlanFeatures.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <Check size={14} className="text-rust-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/pricing" className="btn-primary w-full justify-center">
                Start Pro Trial — 14 days free
              </Link>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-rust-400 transition-colors">
              View full pricing comparison →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-rust-gradient mx-auto flex items-center justify-center mb-6 shadow-lg shadow-rust-500/25">
            <Flame size={28} className="text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Ready to dominate?</h2>
          <p className="text-gray-400 mb-8 text-lg">
            Join hundreds of Rust clans already using RustClanBot to coordinate, track, and crush every wipe.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#" className="btn-primary px-8 py-3 text-base">
              Add to Discord — Free
            </a>
            <Link href="/docs/setup" className="btn-secondary px-8 py-3 text-base">
              Read setup guide
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
