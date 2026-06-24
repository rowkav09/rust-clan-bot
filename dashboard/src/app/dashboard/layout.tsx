import Sidebar from '@/components/dashboard/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-dark-800">
      <Sidebar />
      <div className="flex-1 ml-56 min-h-screen overflow-x-hidden">
        {children}
      </div>
    </div>
  )
}
