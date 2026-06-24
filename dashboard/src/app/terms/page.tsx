import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
      <div className="text-sm text-gray-400 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-dark-800 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="section-label mb-3">Legal</div>
          <h1 className="text-4xl font-black text-white mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-600 mb-10">Last updated: June 24, 2026</p>

          <Section title="1. Acceptance">
            <p>
              By adding RustClanBot to your Discord server or using the web dashboard, you agree to these Terms.
              If you do not agree, remove the bot from your server and stop using the dashboard.
            </p>
          </Section>

          <Section title="2. Permitted use">
            <p>RustClanBot is for legitimate Rust clan management. You may not use it to:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Harass, threaten, or abuse other Discord users</li>
              <li>Automate spam or unsolicited messages</li>
              <li>Circumvent Discord Terms of Service</li>
              <li>Attempt to access other servers&apos; data</li>
              <li>Reverse engineer the bot or dashboard</li>
            </ul>
          </Section>

          <Section title="3. Free vs Pro">
            <p>
              The Free plan is provided as-is with no uptime guarantees. Pro plan subscribers receive a 99.9% monthly
              uptime SLA (excluding scheduled maintenance) and priority support. Refunds are available within 7 days
              of initial purchase for monthly plans, and within 30 days for lifetime access.
            </p>
          </Section>

          <Section title="4. API keys">
            <p>
              You are responsible for the Steam and BattleMetrics API keys you provide. Do not share keys that have
              permissions beyond what the bot requires. We are not liable for any consequences arising from
              compromised keys.
            </p>
          </Section>

          <Section title="5. Data">
            <p>
              We store clan data on your behalf. You retain ownership. We do not claim any rights over your clan&apos;s
              data. See our <Link href="/privacy" className="text-rust-400 hover:text-rust-300 transition-colors">Privacy Policy</Link> for
              full details on storage and deletion.
            </p>
          </Section>

          <Section title="6. Service availability">
            <p>
              We may suspend or terminate access if these Terms are violated. We reserve the right to modify or
              discontinue the service with 30 days notice. We are not affiliated with Facepunch Studios (the
              makers of Rust) or Discord Inc.
            </p>
          </Section>

          <Section title="7. Limitation of liability">
            <p>
              RustClanBot is provided &quot;as is&quot;. We are not liable for any loss of in-game data, missed raids,
              or other in-game consequences arising from bot downtime or incorrect data.
            </p>
          </Section>

          <Section title="8. Contact">
            <p>
              Questions?{' '}
              <a href="https://discord.gg/placeholder" target="_blank" rel="noopener noreferrer" className="text-rust-400 hover:text-rust-300 transition-colors">
                Join our Discord support server
              </a>.
            </p>
          </Section>

          <div className="pt-6 border-t border-dark-400 flex gap-6">
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-rust-400 transition-colors">Privacy Policy →</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
