import Navigation from '@/components/Navigation'
import LiveTicker from '@/components/LiveTicker'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden page-fade-in">
      {/* Scrolling Price Ticker */}
      <LiveTicker />

      <div className="flex flex-1 overflow-hidden">
        {/* Narrow Navigation Sidebar */}
        <Navigation />

        {/* Main Dashboard Panel */}
        <main className="flex-1 flex flex-col bg-[#080807] overflow-y-auto border-l border-white/5">
          {children}
        </main>
      </div>
    </div>
  )
}
