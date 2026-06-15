'use client'
import { LogOut, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth.store'
import { useLogout } from '@/hooks/useAuth'

export default function Header() {
  const { user } = useAuthStore()
  const logout = useLogout()

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground flex items-center gap-2">
          <UserCircle className="h-4 w-4" />
          {user?.full_name}
        </span>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" />
          Đăng xuất
        </Button>
      </div>
    </header>
  )
}
