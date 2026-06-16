'use client'
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGetProfile, useUpdateProfile, useUpdateEmail, useUpdatePassword } from '@/hooks/useProfile'
import type { User } from '@/types/auth.types'
import dayjs from 'dayjs'

// ─── Schemas ────────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  phone: z
    .string()
    .regex(/^(0[3-9])[0-9]{8}$/, 'Số điện thoại không hợp lệ (VD: 0901234567)')
    .or(z.literal('')),
  dateOfBirth: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true
        return dayjs().diff(dayjs(val), 'year') >= 18
      },
      { message: 'Phải đủ 18 tuổi' },
    ),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
})

const emailSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
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

type ProfileForm = z.infer<typeof profileSchema>
type EmailForm = z.infer<typeof emailSchema>
type PasswordForm = z.infer<typeof passwordSchema>

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function PwInput({ show, onToggle, ...props }: React.ComponentProps<typeof Input> & { show: boolean; onToggle: () => void }) {
  return (
    <div className="relative">
      <Input type={show ? 'text' : 'password'} className="pr-10" {...props} />
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

// ─── Inner form component — chỉ render sau khi có profile ────────────────────────

function ProfileContent({ profile }: { profile: User }) {
  const updateProfile = useUpdateProfile()
  const updateEmail = useUpdateEmail()
  const updatePassword = useUpdatePassword()

  const [showEmailPw, setShowEmailPw] = useState(false)
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    control: profileControl,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.fullName ?? '',
      phone: profile.phone ?? '',
      dateOfBirth: profile.dateOfBirth ? dayjs(profile.dateOfBirth).format('YYYY-MM-DD') : '',
      gender: (profile.gender ?? '') as ProfileForm['gender'],
    },
  })

  const {
    register: regEmail,
    handleSubmit: handleEmailSubmit,
    reset: resetEmail,
    formState: { errors: emailErrors },
  } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: profile.email, currentPassword: '' },
  })

  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  function onProfileSubmit(form: ProfileForm) {
    updateProfile.mutate({
      fullName: form.fullName,
      phone: form.phone || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      gender: (form.gender || null) as any,
    })
  }

  function onEmailSubmit(form: EmailForm) {
    updateEmail.mutate(form, {
      onSuccess: () => resetEmail({ email: form.email, currentPassword: '' }),
    })
  }

  function onPasswordSubmit(form: PasswordForm) {
    updatePassword.mutate(form, { onSuccess: () => resetPassword() })
  }

  return (
    <Tabs defaultValue="info">
      <TabsList className="w-full">
        <TabsTrigger value="info" className="flex-1">Thông tin cơ bản</TabsTrigger>
        <TabsTrigger value="email" className="flex-1">Cập nhật email</TabsTrigger>
        <TabsTrigger value="password" className="flex-1">Đổi mật khẩu</TabsTrigger>
      </TabsList>

      {/* ── Tab 1: Thông tin cơ bản ──────────────────────────────────────── */}
      <TabsContent value="info" className="mt-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
            <CardDescription>Họ tên, số điện thoại, ngày sinh và giới tính</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">
              <FormField label="Họ tên" error={profileErrors.fullName?.message}>
                <Input {...regProfile('fullName')} placeholder="Nguyễn Văn A" />
              </FormField>

              <FormField label="Số điện thoại" error={profileErrors.phone?.message}>
                <Input {...regProfile('phone')} placeholder="0901234567" />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Ngày sinh" error={profileErrors.dateOfBirth?.message}>
                  <Input type="date" {...regProfile('dateOfBirth')} />
                </FormField>

                <FormField label="Giới tính" error={profileErrors.gender?.message}>
                  <Controller
                    control={profileControl}
                    name="gender"
                    render={({ field }) => (
                      <Select value={field.value || undefined} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn giới tính" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Nam</SelectItem>
                          <SelectItem value="female">Nữ</SelectItem>
                          <SelectItem value="other">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
              </div>

              <div className="flex justify-end pt-1">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Tab 2: Cập nhật email ─────────────────────────────────────────── */}
      <TabsContent value="email" className="mt-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Cập nhật email</CardTitle>
            <CardDescription>Nhập email mới và xác nhận bằng mật khẩu hiện tại</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-5">
              <FormField label="Email mới" error={emailErrors.email?.message}>
                <Input type="email" {...regEmail('email')} placeholder="email@example.com" />
              </FormField>

              <FormField label="Mật khẩu hiện tại" error={emailErrors.currentPassword?.message}>
                <PwInput
                  show={showEmailPw}
                  onToggle={() => setShowEmailPw((v) => !v)}
                  {...regEmail('currentPassword')}
                  placeholder="Xác nhận bằng mật khẩu"
                />
              </FormField>

              <div className="flex justify-end pt-1">
                <Button type="submit" disabled={updateEmail.isPending}>
                  {updateEmail.isPending ? 'Đang lưu...' : 'Cập nhật email'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Tab 3: Đổi mật khẩu ──────────────────────────────────────────── */}
      <TabsContent value="password" className="mt-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Đổi mật khẩu</CardTitle>
            <CardDescription>
              Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và ký tự đặc biệt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5">
              <FormField label="Mật khẩu hiện tại" error={passwordErrors.currentPassword?.message}>
                <PwInput
                  show={showCurrentPw}
                  onToggle={() => setShowCurrentPw((v) => !v)}
                  {...regPassword('currentPassword')}
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </FormField>

              <FormField label="Mật khẩu mới" error={passwordErrors.newPassword?.message}>
                <PwInput
                  show={showNewPw}
                  onToggle={() => setShowNewPw((v) => !v)}
                  {...regPassword('newPassword')}
                  placeholder="Nhập mật khẩu mới"
                />
              </FormField>

              <FormField label="Xác nhận mật khẩu" error={passwordErrors.confirmPassword?.message}>
                <PwInput
                  show={showConfirmPw}
                  onToggle={() => setShowConfirmPw((v) => !v)}
                  {...regPassword('confirmPassword')}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </FormField>

              <div className="flex justify-end pt-1">
                <Button type="submit" disabled={updatePassword.isPending}>
                  {updatePassword.isPending ? 'Đang lưu...' : 'Đổi mật khẩu'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: profile, isLoading } = useGetProfile()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-sm text-muted-foreground mt-1">Quản lý thông tin tài khoản của bạn</p>
      </div>

      {isLoading || !profile ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground text-sm">Đang tải...</p>
        </div>
      ) : (
        <ProfileContent key={profile.id} profile={profile} />
      )}
    </div>
  )
}
