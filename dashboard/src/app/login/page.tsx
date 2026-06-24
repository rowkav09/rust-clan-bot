import Link from 'next/link'
import { Flame, Shield, Users, Crown, ChevronRight } from 'lucide-react'

const DISCORD_ICON = (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.085.118 18.1.135 18.1a19.843 19.843 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
  </svg>
)

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-dark-800 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-rust-gradient flex items-center justify-center shadow-lg shadow-rust-500/30">
            <Flame size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">RustClan<span className="text-rust-500">Bot</span></span>
        </Link>

        {/* Card */}
        <div className="card border-dark-300 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Sign in with Discord to manage your clan. You must be a Leader or Officer
              in a server that has RustClanBot installed.
            </p>
          </div>

          {/* Discord OAuth button */}
          <a
            href="/api/auth/discord"
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl
                       bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold text-sm
                       transition-all duration-200 shadow-lg shadow-[#5865F2]/20"
          >
            {DISCORD_ICON}
            Continue with Discord
            <ChevronRight size={16} className="ml-auto opacity-60" />
          </a>

          {/* What we request */}
          <div className="mt-6 rounded-xl border border-dark-300 bg-dark-700 p-4 space-y-2.5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Permissions requested
            </div>
            {[
              { icon: Users,  label: 'Your Discord username and avatar' },
              { icon: Shield, label: 'Servers you have Manage Server permission in' },
              { icon: Crown,  label: 'No access to messages or server content' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-xs text-gray-400">
                <Icon size={13} className="text-gray-600 shrink-0" />
                {label}
              </div>
            ))}
          </div>

          {/* Demo link */}
          <div className="mt-6 text-center">
            <Link href="/dashboard"
              className="text-sm text-gray-500 hover:text-rust-400 transition-colors">
              Browse demo dashboard without signing in →
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          By signing in you agree to our{' '}
          <Link href="/terms" className="text-gray-500 hover:text-rust-400 transition-colors">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-gray-500 hover:text-rust-400 transition-colors">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
