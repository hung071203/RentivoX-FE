import LandlordSidebar from './LandlordSidebar'
import Header from './Header'
import ChatWidget from '@/components/chat/ChatWidget'

export default function LandlordLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <LandlordSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-muted/40 p-6">{children}</main>
      </div>
      <ChatWidget />
    </div>
  )
}
