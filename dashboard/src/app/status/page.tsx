import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Check, AlertTriangle } from 'lucide-react'

type ServiceStatus = 'operational' | 'degraded' | 'outage'

const services: { name: string; status: ServiceStatus; latency?: string }[] = [
  { name: 'Discord Bot Gateway',       status: 'operational', latency: '42ms' },
  { name: 'Web Dashboard',             status: 'operational', latency: '89ms' },
  { name: 'BattleMetrics Sync',        status: 'operational', latency: '210ms' },
  { name: 'Rust+ Push Notifications',  status: 'operational', latency: '55ms' },
  { name: 'Steam API',                 status: 'operational', latency: '180ms' },
  { name: 'Discord OAuth',             status: 'operational', latency: '95ms' },
]

const incidents: { date: string; title: string; body: string; resolved: boolean }[] = [
  {
    date: 'June 20, 2026',
    title: 'BattleMetrics sync delay',
    body: 'Playtime sync was delayed by up to 45 minutes for approximately 2 hours due to BattleMetrics API rate limiting. All data was eventually synced correctly. No data was lost.',
    resolved: true,
  },
]

const statusConfig: Record<ServiceStatus, { label: string; color: string; dot: string; bg: string }> = {
  operational: { label: 'Operational',      color: 'text-green-400',  dot: 'bg-green-400',  bg: 'bg-green-500/10' },
  degraded:    { label: 'Degraded',         color: 'text-yellow-400', dot: 'bg-yellow-400 animate-pulse', bg: 'bg-yellow-500/10' },
  outage:      { label: 'Outage',           color: 'text-red-400',    dot: 'bg-red-400 animate-pulse',    bg: 'bg-red-500/10' },
}

const allOperational = services.every(s => s.status === 'operational')

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-dark-800 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="section-label mb-3">System Status</div>
          <h1 className="text-4xl font-black text-white mb-8">Status</h1>

          {/* Overall status banner */}
          <div className={`rounded-xl border p-5 mb-8 flex items-center gap-4 ${
            allOperational
              ? 'border-green-500/30 bg-green-500/8'
              : 'border-yellow-500/30 bg-yellow-500/8'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              allOperational ? 'bg-green-500/20' : 'bg-yellow-500/20'
            }`}>
              {allOperational
                ? <Check size={20} className="text-green-400" />
                : <AlertTriangle size={20} className="text-yellow-400" />}
            </div>
            <div>
              <div className={`font-bold text-lg ${allOperational ? 'text-green-400' : 'text-yellow-400'}`}>
                {allOperational ? 'All systems operational' : 'Partial service degradation'}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">
                Last checked: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} UTC
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="card border-dark-400 mb-8">
            <h2 className="text-sm font-semibold text-white mb-4">Services</h2>
            <div className="space-y-0">
              {services.map((svc, i) => {
                const cfg = statusConfig[svc.status]
                return (
                  <div key={svc.name}
                    className={`flex items-center justify-between py-3 ${i < services.length - 1 ? 'border-b border-dark-400/50' : ''}`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className="text-sm text-gray-300">{svc.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {svc.latency && (
                        <span className="text-xs text-gray-600 font-mono">{svc.latency}</span>
                      )}
                      <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Uptime */}
          <div className="card border-dark-400 mb-8">
            <h2 className="text-sm font-semibold text-white mb-4">Uptime — last 90 days</h2>
            <div className="space-y-3">
              {[
                { label: 'Discord Bot Gateway',   pct: 99.97 },
                { label: 'Web Dashboard',          pct: 99.91 },
                { label: 'BattleMetrics Sync',     pct: 99.72 },
              ].map(u => (
                <div key={u.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">{u.label}</span>
                    <span className="text-green-400 font-semibold">{u.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-dark-400 overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${u.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Incidents */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-4">Recent incidents</h2>
            {incidents.length === 0 ? (
              <div className="text-sm text-gray-600 text-center py-8 rounded-xl border border-dashed border-dark-400">
                No incidents in the last 90 days.
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.map(inc => (
                  <div key={inc.title} className="card border-dark-400">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <span className="text-sm font-semibold text-white">{inc.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {inc.resolved && (
                          <span className="badge bg-green-500/15 text-green-400 border border-green-500/25 text-[10px]">
                            <Check size={9} />Resolved
                          </span>
                        )}
                        <span className="text-xs text-gray-600">{inc.date}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{inc.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
