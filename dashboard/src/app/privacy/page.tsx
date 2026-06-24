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

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark-800 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="section-label mb-3">Legal</div>
          <h1 className="text-4xl font-black text-white mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-10">Last updated: June 24, 2026</p>

          <Section title="1. What we collect">
            <p>
              When you add RustClanBot to your Discord server or sign in to the dashboard, we collect:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Discord user ID, username, and avatar (via Discord OAuth)</li>
              <li>Discord server (guild) ID and name</li>
              <li>In-game names and Steam IDs linked voluntarily by members</li>
              <li>BattleMetrics player IDs linked voluntarily by members</li>
              <li>Playtime data synced from BattleMetrics using your own API token</li>
              <li>Task, raid, application, warning, and intel data entered by your clan officers</li>
            </ul>
          </Section>

          <Section title="2. How we use your data">
            <p>Data is used solely to operate RustClanBot features within your Discord server. We do not:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Sell your data to third parties</li>
              <li>Use your data for advertising</li>
              <li>Share your data with other RustClanBot servers</li>
              <li>Read Discord messages beyond what the bot is directly mentioned in</li>
            </ul>
          </Section>

          <Section title="3. API keys">
            <p>
              Steam API keys and BattleMetrics tokens that you provide are stored encrypted at rest.
              They are only used to make requests on behalf of your server and are never shared
              with other users or third parties.
            </p>
          </Section>

          <Section title="4. Data retention">
            <p>
              Your clan data (members, tasks, raids, etc.) is stored for as long as the bot is in your server.
              When you remove the bot, your data is scheduled for deletion within 30 days.
              You may request immediate deletion by contacting us via our Discord support server.
            </p>
          </Section>

          <Section title="5. Cookies">
            <p>
              The web dashboard uses a single session cookie to keep you logged in via Discord OAuth.
              No tracking cookies or third-party analytics cookies are set.
            </p>
          </Section>

          <Section title="6. Your rights">
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Access all data we hold about your Discord account</li>
              <li>Request deletion of your personal data</li>
              <li>Export your clan data in JSON format (via the dashboard)</li>
            </ul>
            <p>To exercise these rights, contact us through our Discord support server.</p>
          </Section>

          <Section title="7. Contact">
            <p>
              Questions about this policy? Reach us on our{' '}
              <a href="https://discord.gg/placeholder" target="_blank" rel="noopener noreferrer" className="text-rust-400 hover:text-rust-300 transition-colors">Discord support server</a>.
            </p>
          </Section>

          <div className="pt-6 border-t border-dark-400">
            <Link href="/terms" className="text-sm text-gray-500 hover:text-rust-400 transition-colors">
              Read our Terms of Service →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
