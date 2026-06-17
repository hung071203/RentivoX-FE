'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Eye, EyeOff, ArrowLeft, ShieldCheck, Mail, KeyRound } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForgotPassword, useResetPassword } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'

// ─── Schemas ────────────────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
})

const resetSchema = z
  .object({
    otp: z.string().regex(/^\d{6}$/, 'Mã OTP gồm 6 chữ số'),
    newPassword: z
      .string()
      .min(8, 'Mật khẩu tối thiểu 8 ký tự')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+~`|}{[\]:;?><,./-])/,
        'Phải có chữ hoa, chữ thường và ký tự đặc biệt',
      ),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Xác nhận mật khẩu không khớp',
    path: ['confirmPassword'],
  })

type EmailForm = z.infer<typeof emailSchema>
type ResetForm = z.infer<typeof resetSchema>

// ─── Password input — ẩn eye icon mặc định của trình duyệt ───────────────────────

function PwInput({
  show,
  onToggle,
  ...props
}: React.ComponentProps<typeof Input> & { show: boolean; onToggle: () => void }) {
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        autoComplete="new-password"
        className="h-12 text-[15px] pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-contacts-auto-fill-button]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
        {...props}
      />
      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────────

const steps = [
  { icon: Mail, label: 'Nhập email' },
  { icon: KeyRound, label: 'Đặt lại mật khẩu' },
]

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [pendingEmail, setPendingEmail] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const forgotPassword = useForgotPassword()
  const resetPassword = useResetPassword()

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) })
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) })

  function onSendOtp(form: EmailForm) {
    forgotPassword.mutate(form, {
      onSuccess: () => {
        setPendingEmail(form.email)
        setStep('reset')
      },
    })
  }

  function onReset(form: ResetForm) {
    resetPassword.mutate({
      email: pendingEmail,
      otp: form.otp,
      newPassword: form.newPassword,
      confirmPassword: form.confirmPassword,
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — branding ──────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] bg-primary flex-col justify-between p-14 text-primary-foreground">
        <span className="font-bold text-2xl tracking-tight">RentivoX</span>

        <div className="space-y-10">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Đặt lại<br />mật khẩu<br />của bạn.
            </h1>
            <p className="text-primary-foreground/75 text-lg leading-relaxed max-w-sm">
              Nhập email đã đăng ký — chúng tôi sẽ gửi mã OTP để xác thực danh tính và tạo mật khẩu mới.
            </p>
          </div>

          {/* Step indicator */}
          <div className="space-y-3">
            {steps.map((s, i) => {
              const isActive = (i === 0 && step === 'email') || (i === 1 && step === 'reset')
              const isDone = i === 0 && step === 'reset'
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-primary-foreground text-primary'
                        : isDone
                        ? 'bg-primary-foreground/30 text-primary-foreground'
                        : 'bg-primary-foreground/10 text-primary-foreground/40'
                    }`}
                  >
                    <s.icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`text-[15px] ${
                      isActive
                        ? 'text-primary-foreground font-semibold'
                        : isDone
                        ? 'text-primary-foreground/60 line-through'
                        : 'text-primary-foreground/40'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-primary-foreground/40 text-sm">© 2025 RentivoX. Đồ án tốt nghiệp.</p>
      </div>

      {/* ── Right panel — form ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[420px] space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden">
            <span className="font-bold text-2xl text-primary">RentivoX</span>
          </div>

          <div className="space-y-2">
            <Link
              href={ROUTES.LOGIN}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Quay lại đăng nhập
            </Link>
            <h2 className="text-3xl font-bold tracking-tight">
              {step === 'email' ? 'Quên mật khẩu' : 'Tạo mật khẩu mới'}
            </h2>
            <p className="text-muted-foreground">
              {step === 'email'
                ? 'Nhập email của bạn để nhận mã OTP.'
                : <>Mã OTP đã gửi đến <span className="font-medium text-foreground">{pendingEmail}</span>.</>}
            </p>
          </div>

          {/* Step 1 — nhập email */}
          {step === 'email' && (
            <form onSubmit={emailForm.handleSubmit(onSendOtp)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[15px] font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  autoComplete="email"
                  className="h-12 text-[15px]"
                  {...emailForm.register('email')}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-[15px] font-semibold mt-2"
                disabled={forgotPassword.isPending}
              >
                {forgotPassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gửi mã OTP
              </Button>
            </form>
          )}

          {/* Step 2 — nhập OTP + mật khẩu mới */}
          {step === 'reset' && (
            <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-[15px] font-medium">Mã OTP</Label>
                <Input
                  id="otp"
                  placeholder="000000"
                  maxLength={6}
                  className="h-12 text-[15px] tracking-[0.3em] font-mono"
                  {...resetForm.register('otp')}
                />
                {resetForm.formState.errors.otp && (
                  <p className="text-sm text-destructive">{resetForm.formState.errors.otp.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-[15px] font-medium">Mật khẩu mới</Label>
                <PwInput
                  id="newPassword"
                  show={showNew}
                  onToggle={() => setShowNew((v) => !v)}
                  placeholder="Tối thiểu 8 ký tự"
                  {...resetForm.register('newPassword')}
                />
                {resetForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">{resetForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[15px] font-medium">Xác nhận mật khẩu</Label>
                <PwInput
                  id="confirmPassword"
                  show={showConfirm}
                  onToggle={() => setShowConfirm((v) => !v)}
                  placeholder="Nhập lại mật khẩu mới"
                  {...resetForm.register('confirmPassword')}
                />
                {resetForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{resetForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => {
                    setStep('email')
                    resetForm.reset()
                  }}
                >
                  Gửi lại OTP
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 text-[15px] font-semibold"
                  disabled={resetPassword.isPending}
                >
                  {resetPassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Đặt lại mật khẩu
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
