import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">RentivoX</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hệ thống quản lý nhà trọ thông minh
          </p>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Đăng nhập</h2>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
