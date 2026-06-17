'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react'
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

// ─── Password input with toggle ──────────────────────────────────────────────────

function PwInput({
  show,
  onToggle,
  ...props
}: React.ComponentProps<typeof Input> & { show: boolean; onToggle: () => void }) {
  return (
    <div className="relative">
      <Input type={show ? 'text' : 'password'} className="h-12 text-[15px] pr-10" {...props} />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────────

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
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-8">
      <div className="w-full max-w-[420px] space-y-8">
        <div className="space-y-1">
          <Link
            href={ROUTES.LOGIN}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại đăng nhập
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">Quên mật khẩu</h2>
          {step === 'email' ? (
            <p className="text-muted-foreground">
              Nhập email của bạn để nhận mã OTP đặt lại mật khẩu.
            </p>
          ) : (
            <p className="text-muted-foreground">
              Mã OTP đã được gửi đến <span className="font-medium text-foreground">{pendingEmail}</span>. Kiểm tra hộp thư và nhập mã bên dưới.
            </p>
          )}
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
              className="w-full h-12 text-[15px] font-semibold"
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

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12"
                onClick={() => setStep('email')}
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
  )
}
