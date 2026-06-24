import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Check, X, HelpCircle, Zap, Crown, Flame } from 'lucide-react'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Everything a small clan needs to get started.',
    cta: 'Add to Discord',
    ctaHref: '#',
    highlight: false,
    badge: null,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    period: 'per month',
    yearly: 79,
    description: 'Full power for serious clans that mean business.',
    cta: 'Start 14-day Trial',
    ctaHref: '#',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: 149,
    period: 'one-time',
    description: 'Pay once, own it forever. No recurring fees.',
    cta: 'Get Lifetime Access',
    ctaHref: '#',
    highlight: false,
    badge: 'Best Value',
  },
]

const featureGroups = [
  {
    group: 'Core Features',
    features: [
      { name: 'Time tracking (check-in/out)',       free: true,     pro: true,      lifetime: true },
      { name: 'Basic leaderboard',                  free: true,     pro: true,      lifetime: true },
      { name: 'Task management',                    free: true,     pro: true,      lifetime: true },
      { name: 'Raid scheduling & RSVP',             free: true,     pro: true,      lifetime: true },
      { name: 'Member applications',                free: true,     pro: true,      lifetime: true },
      { name: 'Warning system',                     free: true,     pro: true,      lifetime: true },
      { name: 'Basic slash commands (40+)',          free: true,     pro: true,      lifetime: true },
    ],
  },
  {
    group: 'Advanced Features',
    features: [
      { name: 'BattleMetrics auto-sync',            free: false,    pro: true,      lifetime: true },
      { name: 'Rust+ integration',                  free: false,    pro: true,      lifetime: true },
      { name: 'Intel & enemy tracking',             free: false,    pro: true,      lifetime: true },
      { name: 'Population graphs & alerts',         free: false,    pro: true,      lifetime: true },
      { name: 'Advanced clan analytics',            free: false,    pro: true,      lifetime: true },
      { name: 'Clan health dashboard',              free: false,    pro: true,      lifetime: true },
      { name: 'Ally/enemy clan tracking',           free: false,    pro: true,      lifetime: true },
      { name: 'Wipe history & comparison',          free: false,    pro: true,      lifetime: true },
    ],
  },
  {
    group: 'Automation',
    features: [
      { name: 'Auto-leaderboard posting',           free: true,     pro: true,      lifetime: true },
      { name: 'Auto-promote Recruit → Member',      free: true,     pro: true,      lifetime: true },
      { name: 'Daily auto-generated tasks',         free: false,    pro: true,      lifetime: true },
      { name: '20+ automation toggles',             free: false,    pro: true,      lifetime: true },
      { name: 'Pre-wipe & raid reminders',          free: true,     pro: true,      lifetime: true },
      { name: 'Enemy online alerts',                free: false,    pro: true,      lifetime: true },
      { name: 'Wipe countdown channel rename',      free: true,     pro: true,      lifetime: true },
    ],
  },
  {
    group: 'Limits',
    features: [
      { name: 'Discord servers',                    free: '1',      pro: '3',       lifetime: 'Unlimited' },
      { name: 'Max members tracked',               free: '30',     pro: 'Unlimited', lifetime: 'Unlimited' },
      { name: 'Wipe history kept',                  free: '3 wipes', pro: 'All',    lifetime: 'All' },
      { name: 'Intel notes',                        free: '25',     pro: 'Unlimited', lifetime: 'Unlimited' },
    ],
  },
  {
    group: 'Support',
    features: [
      { name: 'Community Discord support',          free: true,     pro: true,      lifetime: true },
      { name: 'Priority support',                   free: false,    pro: true,      lifetime: true },
      { name: 'Feature request voting',             free: false,    pro: true,      lifetime: true },
      { name: 'Early access to new features',       free: false,    pro: false,     lifetime: true },
    ],
  },
]

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-sm font-medium text-gray-300">{value}</span>
  }
  return value
    ? <Check size={16} className="text-green-400 mx-auto" />
    : <X size={14} className="text-gray-700 mx-auto" />
}

const faqs = [
  {
    q: 'Can I try Pro features before paying?',
    a: 'Yes — every new server gets a 14-day Pro trial automatically when you add the bot. No credit card required.',
  },
  {
    q: 'What happens when my Pro trial ends?',
    a: "Your bot downgrades to the Free plan. Your data is preserved. Pro-only features (Rust+, intel, automation) will pause until you upgrade.",
  },
  {
    q: 'Does the bot work if I self-host?',
    a: 'Yes — the bot is open source and self-hostable for free with all features unlocked. The hosted version is for clans that want zero-maintenance.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Stripe-powered: credit/debit cards, PayPal, and most regional payment methods. All transactions are secure.',
  },
  {
    q: 'Can I switch between monthly and yearly?',
    a: 'Yes, anytime from your dashboard. Switching to yearly prorates the difference.',
  },
  {
    q: 'Is there a refund policy?',
    a: "Yes — 7-day money-back guarantee on Pro. No questions asked. Lifetime access has a 30-day refund window.",
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-dark-800 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-14">
            <div className="section-label mb-3">Pricing</div>
            <h1 className="text-5xl font-black text-white mb-4">Simple, transparent pricing</h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Start free. Upgrade when your clan needs more power.
              No hidden fees, no per-member charges.
            </p>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
            {plans.map(plan => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-7 border transition-all ${
                  plan.highlight
                    ? 'border-rust-500/50 bg-gradient-to-b from-rust-500/8 to-dark-600 shadow-xl shadow-rust-500/10'
                    : 'border-dark-300 bg-dark-600'
                }`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold border ${
                    plan.highlight ? 'bg-rust-500 text-white border-rust-400' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                  }`}>
                    {plan.badge}
                  </div>
                )}

                <div className={`w-10 h-10 rounded-xl mb-5 flex items-center justify-center ${
                  plan.id === 'free' ? 'bg-gray-500/15' : plan.id === 'pro' ? 'bg-rust-500/15' : 'bg-yellow-500/15'
                }`}>
                  {plan.id === 'free' ? <Zap size={18} className="text-gray-400" /> :
                   plan.id === 'pro' ? <Flame size={18} className="text-rust-400" /> :
                   <Crown size={18} className="text-yellow-400" />}
                </div>

                <div className="mb-1 text-sm font-semibold text-gray-400">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  {plan.price === 0
                    ? <span className="text-4xl font-black text-white">Free</span>
                    : <>
                        <span className="text-2xl font-bold text-gray-400">$</span>
                        <span className="text-4xl font-black text-white">{plan.price}</span>
                      </>
                  }
                </div>
                <div className="text-sm text-gray-500 mb-2">{plan.period}</div>
                {plan.yearly && (
                  <div className="text-xs text-green-400 mb-4">
                    Or ${plan.yearly}/year · Save {Math.round((1 - plan.yearly / (plan.price * 12)) * 100)}%
                  </div>
                )}
                <p className="text-sm text-gray-500 mb-7 leading-relaxed">{plan.description}</p>

                <a
                  href={plan.ctaHref}
                  className={plan.highlight ? 'btn-primary w-full justify-center' : 'btn-secondary w-full justify-center'}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>

          {/* Feature comparison table */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Full feature comparison</h2>
            <div className="rounded-2xl border border-dark-300 overflow-hidden">
              <div className="grid grid-cols-4 bg-dark-600 border-b border-dark-400 px-6 py-4 text-sm font-semibold">
                <div className="text-gray-400">Feature</div>
                <div className="text-center text-gray-300">Free</div>
                <div className="text-center text-rust-400">Pro</div>
                <div className="text-center text-yellow-400">Lifetime</div>
              </div>
              {featureGroups.map(group => (
                <div key={group.group}>
                  <div className="px-6 py-3 bg-dark-700 border-b border-dark-400">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{group.group}</span>
                  </div>
                  {group.features.map((f, i) => (
                    <div
                      key={f.name}
                      className={`grid grid-cols-4 px-6 py-3.5 text-sm border-b border-dark-400/50 ${
                        i % 2 === 0 ? 'bg-dark-600' : 'bg-dark-700/50'
                      }`}
                    >
                      <div className="text-gray-300">{f.name}</div>
                      <div className="text-center"><Cell value={f.free} /></div>
                      <div className="text-center"><Cell value={f.pro} /></div>
                      <div className="text-center"><Cell value={f.lifetime} /></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Self-hosting callout */}
          <div className="rounded-2xl border border-dark-300 bg-dark-600 p-8 mb-20 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Self-hosting</div>
              <h3 className="text-xl font-bold text-white mb-2">Prefer to host it yourself?</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                RustClanBot is open source. Clone the repo, add your bot token, and run it on your own server for free with
                all features unlocked. Best for technically inclined clans that want full control.
              </p>
            </div>
            <div className="shrink-0 flex flex-col gap-3 min-w-[180px]">
              <a href="#" className="btn-secondary text-sm justify-center">
                View on GitHub
              </a>
              <Link href="/docs/setup" className="btn-ghost text-sm justify-center text-gray-400">
                Self-host guide →
              </Link>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Frequently asked questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqs.map(faq => (
                <div key={faq.q} className="card border-dark-300">
                  <div className="flex gap-3">
                    <HelpCircle size={16} className="text-rust-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white text-sm mb-2">{faq.q}</div>
                      <div className="text-sm text-gray-500 leading-relaxed">{faq.a}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
