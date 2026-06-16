import AdminSidebar from './AdminSidebar'
import Header from './Header'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-muted/40 p-6">{children}</main>
      </div>
    </div>
  )
}
