import { Check } from 'lucide-react'
import LoginForm from '@/components/auth/LoginForm'

const features = [
  'Tự động tạo hóa đơn mồng 1 hàng tháng',
  'Theo dõi chỉ số điện nước chính xác',
  'Quản lý hợp đồng & khách thuê minh bạch',
]

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-[52%] bg-primary flex-col justify-between p-14 text-primary-foreground">
        <span className="font-bold text-2xl tracking-tight">RentivoX</span>

        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Quản lý nhà trọ<br />thông minh,<br />đơn giản.
            </h1>
            <p className="text-primary-foreground/75 text-lg leading-relaxed max-w-sm">
              Số hóa toàn bộ vòng đời thuê phòng — từ hợp đồng, hóa đơn đến ghi nhận thanh toán.
            </p>
          </div>

          <div className="space-y-3">
            {features.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-primary-foreground/15 flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span className="text-primary-foreground/90 text-[15px]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-primary-foreground/40 text-sm">© 2025 RentivoX. Đồ án tốt nghiệp.</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[420px] space-y-8">
          <div className="lg:hidden mb-2">
            <span className="font-bold text-2xl text-primary">RentivoX</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Đăng nhập</h2>
            <p className="text-muted-foreground">
              Chào mừng trở lại! Nhập thông tin tài khoản để tiếp tục.
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
